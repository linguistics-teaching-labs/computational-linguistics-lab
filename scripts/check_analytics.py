#!/usr/bin/env python3
"""Audit every published HTML page; optionally repair wholly missing GA4 tags.

Python standard library only. HTTP checks never execute JS or send GA events.
The deliberately strict bootstrap check enforces this site's single-tag pattern.
"""
import argparse
import concurrent.futures
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import sys
import time
from urllib.parse import parse_qs, quote, urljoin, urlsplit
from urllib.request import Request, urlopen

MEASUREMENT_ID = "G-BQB575CQX3"
ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP = """window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-BQB575CQX3');"""
SNIPPET = f'''  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"></script>
  <script>
    {BOOTSTRAP.replace(chr(10), chr(10) + '    ')}
  </script>
'''
SKIP = {"node_modules", "vendor", "venv", "__pycache__"}
MARKERS = re.compile(r"gtag\s*\(|dataLayer|googletagmanager\.com|google-analytics\.com|G-[A-Z0-9]{6,}")


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.scripts = []
        self.head = False
        self.head_count = 0
        self.head_end = None
        self.inert = 0
        self.current = None
        self.offsets = [0]
        for match in re.finditer("\n", html):
            self.offsets.append(match.end())
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag in {"template", "noscript"}:
            self.inert += 1
        if tag == "head":
            self.head = True
            self.head_count += 1
        if tag == "script":
            self.current = {"attrs": dict(attrs), "body": "", "head": self.head, "inert": self.inert > 0}
            self.scripts.append(self.current)

    def handle_endtag(self, tag):
        if tag == "script":
            self.current = None
        if tag == "head":
            line, col = self.getpos()
            self.head_end = self.offsets[line - 1] + col
            self.head = False
        if tag in {"template", "noscript"}:
            self.inert = max(0, self.inert - 1)

    def handle_data(self, data):
        if self.current is not None:
            self.current["body"] += data


def compact(js):
    # Preserve identifier boundaries and whitespace inside string literals.
    tokens = re.findall(r'''\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+|\S''', js)
    return [token.replace('"', "'") for token in tokens]


def audit(html):
    page = Page(html)
    errors = []
    relevant = [s for s in page.scripts if MARKERS.search(s["body"] + str(s["attrs"]))]
    loaders = [s for s in relevant if "googletagmanager.com/gtag/js" in s["attrs"].get("src", "")]
    if page.head_count != 1 or page.head_end is None:
        errors.append("expected one complete <head> element")
    if len(loaders) != 1:
        errors.append(f"expected one Google tag loader; found {len(loaders)}")
    else:
        tag = loaders[0]
        attrs = tag["attrs"]
        url = urlsplit(attrs["src"])
        if (url.scheme, url.netloc, url.path) != ("https", "www.googletagmanager.com", "/gtag/js") or parse_qs(url.query) != {"id": [MEASUREMENT_ID]}:
            errors.append("Google tag loader has the wrong URL or measurement ID")
        if "async" not in attrs:
            errors.append("Google tag loader must be async")
    bootstraps = [s for s in relevant if not s["attrs"].get("src")]
    if len(bootstraps) != 1 or compact(bootstraps[0]["body"]) != compact(BOOTSTRAP):
        errors.append("expected one standard GA4 bootstrap with automatic pageviews enabled")
    if len(relevant) != 2:
        errors.append("missing, duplicate, or conflicting analytics scripts")
    for script in relevant:
        attrs = script["attrs"]
        if not script["head"] or script["inert"]:
            errors.append("analytics scripts must be active in <head>")
        if attrs.get("type", "").lower() not in {"", "text/javascript", "application/javascript"} or "nomodule" in attrs:
            errors.append("analytics script is not an executable classic script")
    return list(dict.fromkeys(errors))


def repair(html):
    """Only add a tag when no analytics marker exists anywhere in the document."""
    page = Page(html)
    if MARKERS.search(html) or page.head_count != 1 or page.head_end is None:
        return html
    return html[:page.head_end] + "\n" + SNIPPET + html[page.head_end:]


def html_files(root):
    for directory, subdirs, files in os.walk(root):
        subdirs[:] = sorted(d for d in subdirs if not d.startswith(".") and d not in SKIP)
        for name in sorted(files):
            if Path(name).suffix.lower() in {".html", ".htm"}:
                yield Path(directory) / name


def published_url(base, relative):
    path = relative.as_posix()
    if path.endswith("index.html"):
        path = path[:-len("index.html")]
    return urljoin(base.rstrip("/") + "/", quote(path, safe="/"))


def fetch_html(url, base):
    for attempt in range(3):
        try:
            request = Request(url + "?analytics_audit=" + str(time.time_ns()), headers={"User-Agent": "LinguisticsLabs-AnalyticsAudit/1.0", "Cache-Control": "no-cache"})
            with urlopen(request, timeout=25) as response:
                final = urlsplit(response.url)
                expected = urlsplit(base.rstrip("/") + "/")
                if (final.scheme, final.netloc) != (expected.scheme, expected.netloc) or not final.path.startswith(expected.path):
                    raise ValueError("page redirects outside this lab")
                if response.headers.get_content_type() != "text/html":
                    raise ValueError("published response is not HTML")
                return response.read().decode("utf-8")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)


def check_one(path, base=None):
    relative = path.relative_to(ROOT)
    try:
        html = fetch_html(published_url(base, relative), base) if base else path.read_text(encoding="utf-8")
        return relative.as_posix(), audit(html)
    except Exception as exc:
        return relative.as_posix(), [f"could not inspect page: {exc}"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", metavar="BASE_URL", help="inspect deployed pages discovered from the repository")
    parser.add_argument("--fix", action="store_true", help="insert standard tags only into wholly untagged source pages")
    args = parser.parse_args()
    if args.live and args.fix:
        parser.error("--live and --fix cannot be combined")
    paths = list(html_files(ROOT))
    if not paths:
        print("ERROR: no HTML pages found", file=sys.stderr)
        return 1
    if args.fix:
        for path in paths:
            html = path.read_text(encoding="utf-8")
            fixed = repair(html)
            if fixed != html:
                path.write_text(fixed, encoding="utf-8")
                print(f"REPAIRED {path.relative_to(ROOT)}")
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(lambda path: check_one(path, args.live), paths))
    failed = 0
    for path, errors in results:
        if errors:
            failed += 1
            for error in errors:
                print(f"ERROR {path}: {error}")
                if os.environ.get("GITHUB_ACTIONS") == "true":
                    safe_path = path.replace("%", "%25").replace("\n", "%0A").replace("\r", "%0D").replace(",", "%2C").replace(":", "%3A")
                    safe_error = error.replace("%", "%25").replace("\n", "%0A").replace("\r", "%0D")
                    print(f"::error file={safe_path}::{safe_error}")
        else:
            print(f"PASS {path}")
    summary = f"{'Published' if args.live else 'Source'} analytics: {len(paths) - failed}/{len(paths)} pages passed ({MEASUREMENT_ID})."
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as output:
            output.write(summary + "\n\n")
    return int(failed > 0)


if __name__ == "__main__":
    sys.exit(main())
