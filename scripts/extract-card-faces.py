"""Extract self-contained LGPL SVG faces; retain upstream artwork unchanged.
Run: python3 scripts/extract-card-faces.py
"""
from pathlib import Path
import copy
import re
import xml.etree.ElementTree as ET

out = Path(__file__).resolve().parents[1] / 'public/assets/cards'
ns = 'http://www.w3.org/2000/svg'
xlink = 'http://www.w3.org/1999/xlink'
ET.register_namespace('', ns)
ET.register_namespace('xlink', xlink)
root = ET.parse(out / 'source/svg-cards.svg').getroot()
ids = {el.get('id'): el for el in root.iter() if el.get('id')}
for suit in ['heart', 'diamond', 'spade', 'club']:
    for rank in [str(n) for n in range(1, 11)] + ['jack', 'queen', 'king']:
        name = f'{suit}_{rank}'
        required = set()
        def collect(key):
            if key in required:
                return
            required.add(key)
            for el in ids[key].iter():
                for value in el.attrib.values():
                    for ref in re.findall(r'(?:^#|url\(#)([\w-]+)', value):
                        collect(ref)
        collect(name)
        svg = ET.Element(f'{{{ns}}}svg', {'width':'512', 'height':'720', 'viewBox':'0 0 169.075 244.640', 'preserveAspectRatio':'none'})
        svg.append(ET.Comment(' SVG-cards © David Bellot, Huub de Beer and contributors. LGPL-2.1. See LICENSE, AUTHORS, README.md and source/svg-cards.svg. Extracted by Poker Academy. '))
        defs = ET.SubElement(svg, f'{{{ns}}}defs')
        for key in sorted(required - {name}):
            defs.append(copy.deepcopy(ids[key]))
        svg.append(copy.deepcopy(ids[name]))
        ET.ElementTree(svg).write(out / f'{name}.svg', encoding='utf-8', xml_declaration=True)
print('Extracted 52 self-contained SVG faces')
