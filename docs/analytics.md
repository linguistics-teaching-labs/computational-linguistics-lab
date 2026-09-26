# Google Analytics maintenance

The hub and both public labs use the same GA4 web stream, `G-BQB575CQX3`.
Each HTML page contains exactly one asynchronous Google tag loader and one
standard bootstrap in its `<head>`. GA4 sends the initial pageview automatically;
do not add another manual `page_view` event. Module URLs distinguish the activities
in the **Pages and screens** report. There are no custom events collecting typed
text, student answers, or activity results.

## Automated coverage

The **Analytics coverage** GitHub Actions workflow runs on pushes to `main`, pull
requests, Pages build events, manual runs, and weekly on Wednesday. It discovers
all `.html` and `.htm` files recursively, including newly added modules and pages
outside the module catalog. Hidden directories and dependency directories are
excluded. Keep test HTML fixtures in Python strings rather than published files.

Checks reject missing tags, wrong IDs, duplicate or conflicting analytics scripts,
disabled automatic pageviews, and tags placed in comments, templates, or the body.
The bootstrap intentionally follows one standard pattern; review the checker if
the tracking architecture changes. After Pages builds, on scheduled runs, and on
manual runs, the workflow also retrieves every deployed page and checks its tag.
Live checks retry transient HTTP failures and never execute scripts or send visits
to Google Analytics. Push and PR checks use source files to avoid a deployment race.

Missing tags produce a failed check with file annotations and a downloadable
`analytics-repair` patch artifact. The patch adds tags only to wholly untagged
pages; it leaves existing, ambiguous, or conflicting tracking for manual review.
Review the patch, apply with `git apply analytics-repair.patch`, then commit and
push normally. Checks do not change the default branch or repository permissions.
They are not a deployment gate unless made required in repository rules.

GitHub may disable scheduled workflows in public repositories after 60 days
without repository activity. Re-enable the workflow in Actions if this happens.
Push checks still cover newly added modules. Failed-run notifications depend on
your GitHub notification settings. Standard GitHub-hosted Linux runners are used;
no paid services, API credentials, or analytics secrets are required.

## Adding a page

Run these commands from the repository root after adding HTML:

```sh
python3 scripts/check_analytics.py --fix
python3 scripts/check_analytics.py
python3 -m unittest discover -s scripts -p 'test_check_analytics.py'
```

The repair command preserves valid existing tags. Review the diff before committing.
It intentionally refuses to guess how to repair an existing wrong or duplicate tag.

## What the checks establish

These checks establish source and deployed tag coverage, not GA4 report ingestion.
They cannot inspect property configuration, data filters, consent settings, browser
blockers, or every external JavaScript dependency. After a tracking change, visit a
page in a normal browser and confirm the correct page path in GA4 **Realtime** or
**DebugView**. Use **Pages and screens** to compare the two labs and individual
modules. These reports measure visits and engagement; they do not establish that a
student completed an activity or measure learning outcomes.

References: [Google pageview documentation](https://developers.google.com/analytics/devguides/collection/ga4/views)
and [GitHub scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
