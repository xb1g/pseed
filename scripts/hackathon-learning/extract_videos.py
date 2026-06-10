#!/usr/bin/env python3
"""Extract Round-1 video submissions from the form CSV into normalized JSON."""
import csv, json, sys

# column indices in the Round 1 Submission form
C = {"team": 1, "league": 2, "project": 3, "track": 4, "video": 5,
     "prototype": 6, "problem": 7, "thai_desc": 8}

def main():
    rows = list(csv.reader(open(sys.argv[1], encoding="utf-8")))
    out = []
    for r in rows[1:]:
        if len(r) <= C["video"]:
            continue
        team = (r[C["team"]] or "").strip()
        video = (r[C["video"]] or "").strip()
        if not team or "youtu" not in video:
            continue
        out.append({
            "team": team,
            "league": (r[C["league"]] or "").strip(),
            "project": (r[C["project"]] or "").strip(),
            "track": (r[C["track"]] or "").strip(),
            "video_url": video,
            "prototype": (r[C["prototype"]] or "").strip(),
            "problem": (r[C["problem"]] or "").strip(),
            "thai_desc": (r[C["thai_desc"]] or "").strip(),
        })
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
