import sqlite3
from collections import defaultdict

conn = sqlite3.connect('d:/backEnd/demo_test/data/intellectual_property.db')
c = conn.cursor()

case_persons = defaultdict(set)
for r in c.execute('SELECT case_id, payer, payee FROM transactions').fetchall():
    for x in [r[1], r[2]]:
        if x:
            case_persons[r[0]].add(x)

for r in c.execute('SELECT case_id, initiator, receiver FROM communications').fetchall():
    for x in [r[1], r[2]]:
        if x:
            case_persons[r[0]].add(x)

for r in c.execute('SELECT case_id, sender, receiver FROM logistics').fetchall():
    for x in [r[1], r[2]]:
        if x:
            case_persons[r[0]].add(x)

# Find persons appearing in multiple cases
all_persons = defaultdict(set)
for case_id, persons in case_persons.items():
    for p in persons:
        all_persons[p].add(case_id)

shared = {p: sorted(cases) for p, cases in all_persons.items() if len(cases) > 1}
print("Cross-case shared persons (all sources):")
for p, cases in sorted(shared.items()):
    print(f"  {p}: case IDs {cases}")

print()
print("Expected linked_cases_count per case:")
case_links = defaultdict(set)
for p, cases in all_persons.items():
    if len(cases) > 1:
        for cid in cases:
            case_links[cid].update(cases - {cid})

# Get case_no mapping
case_nos = dict(c.execute('SELECT id, case_no FROM cases').fetchall())
for k, v in sorted(case_links.items()):
    print(f"  Case {k} ({case_nos.get(k)}): linked to {sorted(v)} => linked_cases_count = {len(v)}")

conn.close()
