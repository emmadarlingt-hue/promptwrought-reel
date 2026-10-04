#!/usr/bin/env python3
"""Copy one issue from the site into issue.json, beside reel.html.

    python3 tools/pull-issue.py 010

Reads ../promptwrought-site/issues/010-*.json and writes ./issue.json: the
whole issue, plus the two things the page shows that the site never stores,
`date` ("29 Sept 2026") and `issueLabel` ("Issue 010 · 29 Sept 2026").

The site's files are only ever opened for reading. Standard library only.
"""

import json
import sys
from datetime import date, datetime, time
from pathlib import Path
from zoneinfo import ZoneInfo

REEL = Path(__file__).resolve().parents[1]
ISSUES = REEL.parent / "promptwrought-site" / "issues"
OUT = REEL / "issue.json"

# ── the calendar, copied from promptwrought-site/tools/build-lexicon.py ───
# Issue 1 is ISO week 31 and every issue goes out on the Tuesday of its
# week, at 13:31 London time. The site keeps this rule in Python too, so if
# the volume changes, change it there and here side by side.
VOLUME_YEAR = 2026
FIRST_ISSUE_WEEK = 31
TOTAL_WEEKS = 52
TUESDAY = 2  # in ISO numbering Monday is 1
PUBLISH_ZONE = ZoneInfo("Europe/London")
PUBLISH_TIME = time(13, 31)

# The card's style: "29 Sept 2026". strftime's %b would give "Sep".
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "June",
          "July", "Aug", "Sept", "Oct", "Nov", "Dec")

# What the page draws from. A scaffold from the site's --new is missing
# these, and a half-written entry should not reach a render.
REQUIRED = ("word", "definition", "issueUrl")


def release_date(week):
    """The Tuesday of that ISO week."""
    return date.fromisocalendar(VOLUME_YEAR, week, TUESDAY)


def release_moment(week):
    """The moment the issue reaches subscribers — date *and* time."""
    return datetime.combine(release_date(week), PUBLISH_TIME, tzinfo=PUBLISH_ZONE)


def card_date(day):
    return f"{day.day} {MONTHS[day.month - 1]} {day.year}"


def find_issue(number):
    matches = sorted(ISSUES.glob(f"{number:03d}-*.json"))
    if not matches:
        sys.exit(f"no issue {number:03d} in {ISSUES}")
    if len(matches) > 1:
        names = ", ".join(m.name for m in matches)
        sys.exit(f"more than one issue {number:03d} in {ISSUES}: {names}")
    return matches[0]


def main(argv):
    if len(argv) != 2 or not argv[1].isdigit():
        sys.exit("usage: python3 tools/pull-issue.py <issue number>, e.g. 010")
    number = int(argv[1])

    week = number + FIRST_ISSUE_WEEK - 1
    if not FIRST_ISSUE_WEEK <= week <= TOTAL_WEEKS:
        sys.exit(
            f"issue {number:03d} lands on week {week}, outside the "
            f"{VOLUME_YEAR} volume (weeks {FIRST_ISSUE_WEEK}–{TOTAL_WEEKS}). "
            f"A second year needs its own VOLUME_YEAR."
        )

    source = find_issue(number)
    issue = json.loads(source.read_text(encoding="utf-8"))

    missing = [field for field in REQUIRED if not str(issue.get(field, "")).strip()]
    if missing:
        sys.exit(f"{source.name} is not finished: no {', '.join(missing)}")

    released = release_date(week)
    issue["date"] = card_date(released)
    issue["issueLabel"] = f"Issue {number:03d} · {issue['date']}"

    moment = release_moment(week)
    if datetime.now(PUBLISH_ZONE) < moment:
        print(
            f"  warning: issue {number:03d} goes out "
            f"{moment:%a} {card_date(released)}, {moment:%H:%M} London time. "
            f"Don't push issue.json before then.",
            file=sys.stderr,
        )

    OUT.write_text(json.dumps(issue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"issue.json ← {number:03d} {issue['word']}, {issue['date']}")


if __name__ == "__main__":
    main(sys.argv)
