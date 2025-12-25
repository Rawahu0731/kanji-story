import os, json, re
from collections import defaultdict

voice_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'voice')
story_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'story.json')

files = sorted([f for f in os.listdir(voice_dir) if f.lower().endswith('.wav')])
entries = []
for f in files:
    name = f[:-4]
    parts = name.split('_',2)
    if len(parts) < 3:
        continue
    idx, vname, frag = parts
    frag = frag.replace('…','').replace('...','').strip()
    frag_norm = re.sub(r"[\s\u3000]+"," ", frag)
    entries.append({'file': f, 'vname': vname, 'frag': frag, 'frag_norm': frag_norm})

with open(story_path,'r',encoding='utf-8-sig') as fh:
    story = json.load(fh)

changed = 0
matches_summary = defaultdict(list)

for ci, chap in enumerate(story.get('chapters',[])):
    for di, dlg in enumerate(chap.get('dialogues',[])):
        text = dlg.get('text','').strip()
        if not text:
            continue
        tnorm = text.replace('…','').replace('...','').strip()
        tnorm = re.sub(r"[\s\u3000]+"," ", tnorm)
        matched = []
        for e in entries:
            frag = e['frag_norm']
            if not frag:
                continue
            if tnorm.startswith(frag):
                matched.append(e['file'])
                continue
            if frag in tnorm:
                matched.append(e['file'])
                continue
            if frag and tnorm.startswith(frag[:max(1,min(len(frag),8))]):
                matched.append(e['file'])
                continue
        if matched:
            matched = sorted(list(dict.fromkeys(matched)))
            dlg['voice'] = [os.path.join('voice',m) for m in matched]
            changed += 1
            matches_summary[ci].append((di, len(matched)))

# Output summary followed by separator and full JSON
print(json.dumps({'changed_dialogues': changed, 'chapters_with_changes': len(matches_summary)}, ensure_ascii=False))
print('\n===UPDATED_JSON_START===')
print(json.dumps(story, ensure_ascii=False, indent=4))
# also write updated JSON to a file for patching
out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'story.with_voice.json')
with open(out_path, 'w', encoding='utf-8') as out_f:
    json.dump(story, out_f, ensure_ascii=False, indent=4)
print(f'WROTE:{out_path}')
