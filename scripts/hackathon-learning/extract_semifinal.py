#!/usr/bin/env python3
"""Extract Round-2 (semifinal) judge scores from the judge xlsx into normalized JSON.

Usage: python3 extract_semifinal.py "<path to xlsx>" > semifinal.json

Output shape:
[
  { "raw_team_name": str, "division": "high_school"|"university", "panel": "HS-G1"|...,
    "judge_count": int,
    "scores": {problem, solution, market_fit, readiness, journey, pitching},  # panel means
    "total": float,                                                            # sum, /60
    "per_judge": [ {judge, scores{...6...}, comment} ],
    "comments": [str, ...] }
]
"""
import sys, json, unicodedata
import openpyxl

CRIT = ["problem", "solution", "market_fit", "readiness", "journey", "pitching"]

# panel -> [sheet names]. Teams are judged by exactly one panel.
PANELS = {
    "HS-G1": ["High School บลิ๊งกี้", "High School Angpao", "High School Khem"],
    "HS-G2": ["High School Big", "High School เติม", "High School คุง"],
    "UNI":   ["University Kittikorn", "University Thanakorn"],
}
DIVISION = {"HS-G1": "high_school", "HS-G2": "high_school", "UNI": "university"}


def norm(s):
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = "".join(ch for ch in s if not unicodedata.category(ch).startswith("C"))
    return " ".join(s.split()).strip()


def read_sheet(ws):
    """Return {team_name: {"scores":[6], "comment":str}} for one judge sheet."""
    out = {}
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        team = norm(row[1]) if len(row) > 1 else ""
        if not team or team.lower() == "break":
            continue
        scores = []
        for j in range(2, 8):
            v = row[j] if len(row) > j else None
            try:
                scores.append(float(v))
            except (TypeError, ValueError):
                scores.append(None)
        if not any(v is not None for v in scores):
            continue
        comment = norm(row[8]) if len(row) > 8 else ""
        out[team] = {"scores": scores, "comment": comment}
    return out


def main():
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    results = []
    for panel, sheet_names in PANELS.items():
        per_sheet = [(sn, read_sheet(wb[sn])) for sn in sheet_names]
        teams = set().union(*[d.keys() for _, d in per_sheet])
        rows = []
        for team in teams:
            per_judge, crit_means = [], []
            for ci in range(6):
                vals = [d[team]["scores"][ci] for _, d in per_sheet
                        if team in d and d[team]["scores"][ci] is not None]
                crit_means.append(round(sum(vals) / len(vals), 2) if vals else None)
            comments = []
            for sn, d in per_sheet:
                if team in d:
                    per_judge.append({
                        "judge": sn,
                        "scores": dict(zip(CRIT, d[team]["scores"])),
                        "comment": d[team]["comment"],
                    })
                    if d[team]["comment"]:
                        comments.append(d[team]["comment"])
            present = [v for v in crit_means if v is not None]
            rows.append({
                "raw_team_name": team,
                "division": DIVISION[panel],
                "panel": panel,
                "judge_count": len(per_judge),
                "scores": dict(zip(CRIT, crit_means)),
                "total": round(sum(present), 2),
                "per_judge": per_judge,
                "comments": comments,
            })
        rows.sort(key=lambda r: -r["total"])
        for rank, r in enumerate(rows, 1):
            r["rank_in_panel"] = rank
        results.extend(rows)
    json.dump(results, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
