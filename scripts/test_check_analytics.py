"""Regression cases for omissions, duplicate tracking, and unsafe repairs."""
import tempfile
from pathlib import Path
import unittest

from check_analytics import SNIPPET, audit, html_files, published_url, repair


def page(snippet=SNIPPET):
    return f"<!doctype html><html><head><title>Test</title>{snippet}</head><body></body></html>"


class AnalyticsTests(unittest.TestCase):
    def test_valid_tag_and_formatting(self):
        self.assertEqual(audit(page()), [])
        self.assertEqual(audit(page(SNIPPET.replace("'", '"'))), [])

    def test_missing_wrong_duplicate_and_disabled_tags_fail(self):
        for snippet in ["", SNIPPET * 2, SNIPPET.replace("G-BQB575CQX3", "G-WRONG12345"),
                        SNIPPET.replace("'G-BQB575CQX3');", "'G-BQB575CQX3', {send_page_view:false});"),
                        SNIPPET.replace("function gtag()", "function broken()"),
                        SNIPPET.replace("function gtag()", "functiongtag()"),
                        SNIPPET.replace("G-BQB575CQX3", "G- BQB575CQX3"),
                        SNIPPET.replace("<script>", '<script type="application/json">'),
                        SNIPPET.replace("<script>", "<script nomodule>"),
                        SNIPPET + "<script>gtag('event', 'page_view');</script>"]:
            with self.subTest(snippet=snippet):
                self.assertTrue(audit(page(snippet)))

    def test_inert_tags_cannot_satisfy_check(self):
        without_comment = SNIPPET.replace("<!-- Google tag (gtag.js) -->", "")
        for wrapped in [f"<!-- {without_comment} -->", f"<template>{SNIPPET}</template>", f"<noscript>{SNIPPET}</noscript>"]:
            self.assertTrue(audit(page(wrapped)))
        self.assertTrue(audit(page("").replace("</body>", SNIPPET + "</body>")))

    def test_repair_is_idempotent_and_preserves_content(self):
        original = page("")
        fixed = repair(original)
        self.assertEqual(audit(fixed), [])
        self.assertEqual(repair(fixed), fixed)
        self.assertEqual(fixed.replace("\n" + SNIPPET, "", 1), original)

    def test_repair_refuses_ambiguous_existing_tracking(self):
        for original in [page(), page(SNIPPET * 2), page(SNIPPET.replace("G-BQB575CQX3", "G-OTHER12345")),
                         page(f"<!-- {SNIPPET} -->"), "<html><body>No head</body></html>"]:
            self.assertEqual(repair(original), original)

    def test_new_nested_pages_are_discovered_automatically(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ["index.html", "modules/new/deep/index.html", "about.HTM", "node_modules/demo.html", ".git/test.html"]:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(page())
            self.assertEqual({p.relative_to(root).as_posix() for p in html_files(root)},
                             {"index.html", "modules/new/deep/index.html", "about.HTM"})

    def test_live_urls_keep_project_subpath(self):
        base = "https://linguistics-teaching-labs.github.io/nature-of-language-lab/"
        self.assertEqual(published_url(base, Path("index.html")), base)
        self.assertEqual(published_url(base, Path("modules/new/index.html")), base + "modules/new/")
        self.assertEqual(published_url(base, Path("about.html")), base + "about.html")


if __name__ == "__main__":
    unittest.main()
