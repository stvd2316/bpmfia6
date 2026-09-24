import re, json, html

raw = open('C:/Users/Administrator/Downloads/iss.md', encoding='utf-8-sig').read().split('\n')

# Bagi per blok hari
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
blocks, cur = {}, None
for ln in raw:
    m = re.search(r'\*\*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\*\*', ln)
    if m:
        cur = m.group(1); blocks[cur] = []
        continue
    if cur: blocks[cur].append(ln)

ORG = re.compile(r'([A-Za-z]+(?:\s*\([^)]*\))?)\s*:\s*')

def parse_items(text):
    """'ORG: a, b. ORG2: c' -> [(org, item)] — item tanpa org mewarisi org terakhir."""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('\\', '').replace('  ', ' ').strip()
    text = re.sub(r'\s+', ' ', text)
    out, last_org = [], None
    # belah berdasarkan kemunculan ORG:
    parts = ORG.split(text)
    # parts = [sebelum_org_pertama, org1, isi1, org2, isi2, ...]
    pre = parts[0].strip(' .,;')
    i = 1
    while i < len(parts):
        org, isi = parts[i].strip(), parts[i + 1] if i + 1 < len(parts) else ''
        last_org = org
        for it in re.split(r'[,;]|\.\s+(?=[A-Z])', isi):
            it = it.strip(' .,;')
            if it: out.append((org, it))
        i += 2
    return out, pre

def cell_events(cell):
    cell = cell.strip()
    if not cell: return []
    evs, _ = parse_items(cell)
    return evs

result = {}  # date_key -> [(ltk, title)]
pending = None  # (day, [dates])

def flush(date_tuple, cells):
    (day, dates) = date_tuple
    for idx, d in enumerate(dates):
        cell = cells[idx] if idx < len(cells) else ''
        for (ltk, title) in cell_events(cell):
            result.setdefault(d, []).append((ltk, title))

for day, lines in blocks.items():
    i = 0
    while i < len(lines):
        ln = lines[i]
        cells = [c.strip() for c in ln.strip().strip('|').split('|')]
        # baris tanggal? semua sel non-kosong berupa angka
        nums = [c for c in cells if c != '']
        if nums and all(re.fullmatch(r'\d{1,2}', c) for c in nums) and 'BEM' not in ln and 'HIMANIA' not in ln and 'KOSTAF' not in ln and 'BPM' not in ln and '<p>' not in ln:
            dates = [int(c) for c in nums]
            # kumpulkan sel konten sampai separator / tanggal berikut / akhir
            j = i + 1
            content_rows = []
            while j < len(lines):
                l2 = lines[j]
                c2 = [c.strip() for c in l2.strip().strip('|').split('|')]
                n2 = [c for c in c2 if c != '']
                if re.match(r'^\s*\|?\s*-\s*\|', l2): break
                if n2 and all(re.fullmatch(r'\d{1,2}', c) for c in n2) and '<p>' not in l2 and 'BEM' not in l2 and 'HIMANIA' not in l2 and 'KOSTAF' not in l2 and 'BPM' not in l2:
                    break
                if re.search(r'\*\*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|September|2026)\*\*', l2): break
                content_rows.append(c2)
                j += 1
            # gabungkan semua baris konten per kolom
            if day in ('Friday', 'Saturday'):
                cols = [[], []]
                for r in content_rows:
                    for k in range(min(2, len(r))):
                        if r[k]: cols[k].append(r[k])
                # tanggal Friday+Saturday tercantum di baris tanggal yang sama
                for di, d in enumerate(dates):
                    col = cols[di] if di < 2 else []
                    for (ltk, title) in cell_events(' '.join(col)):
                        result.setdefault((day, d), []).append((ltk, title))
            else:
                merged = ' '.join(c for r in content_rows for c in r if c)
                for d in dates:
                    for (ltk, title) in cell_events(merged):
                        result.setdefault((day, d), []).append((ltk, title))
            i = j
            continue
        i += 1

# Petakan (day, tgl) -> date_key. September 2026; 31=Agustus;
# tanggal buntut 1-4 = Oktober HANYA bila grup terakhir dan sudah lewat tgl 20+
groups = {}
for (day, d) in result.keys():
    groups.setdefault(day, []).append(d)

def key(day, d):
    if day == 'Monday' and d == 31: return f'{d}-8-2026'
    gs = groups[day]
    if d <= 4 and any(g > 20 for g in gs) and d == gs[-1]:
        # khusus Fri/Sat: grup tanggal berisi 2 tanggal (2,3) -> keduanya Oktober
        return f'{d}-10-2026'
    return f'{d}-9-2026'

final = {}
for (day, d), evs in result.items():
    final.setdefault(key(day, d), []).extend(evs)

print('TOTAL TANGGAL BERISI:', len(final))
print('TOTAL EVENT:', sum(len(v) for v in final.values()))
print()
for k in sorted(final, key=lambda x: (int(x.split('-')[2]), int(x.split('-')[1]), int(x.split('-')[0]))):
    print(f'== {k} ({len(final[k])} acara)')
    for (ltk, t) in final[k]:
        print(f'   [{ltk}] {t}')
json.dump(final, open('C:/Users/Administrator/Documents/bpmfiuy/scripts/iss-parsed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
