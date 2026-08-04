import csv
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
bis_root = root / 'BIS Lists'
output_path = bis_root / 'all-bis-items.csv'
error_path = bis_root / 'bis-extraction-errors.csv'
completeness_path = bis_root / 'bis-completeness-report.csv'

if not bis_root.exists():
    raise FileNotFoundError(f'Missing BIS root: {bis_root}')


def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip().lower()


def derive_class_name(txt_path: Path) -> str:
    relative_parts = txt_path.relative_to(bis_root).parts
    if len(relative_parts) >= 2:
        return relative_parts[0]
    return ''


def discover_known_specs(class_dir: Path) -> list[str]:
    return [child.name for child in sorted(class_dir.iterdir()) if child.is_dir()]


def infer_spec_from_title(title: str, known_specs: list[str]) -> str | None:
    normalized_title = normalize_text(title)
    for spec in known_specs:
        if normalize_text(spec) in normalized_title:
            return spec
    return None


def infer_class_from_title(title: str) -> str | None:
    normalized_title = normalize_text(title)
    class_aliases = {
        'Druid': ['druid'],
        'Warrior': ['warrior', 'warriors', 'dps warrior'],
        'Paladin': ['paladin', 'paladins'],
        'Hunter': ['hunter', 'hunters'],
        'Shaman': ['shaman', 'shamans'],
        'Priest': ['priest', 'priests', 'healing priest'],
        'Mage': ['mage', 'mages', 'arcane mage', 'fire mage', 'frost mage'],
        'Warlock': ['warlock', 'warlocks'],
        'Rogue': ['rogue', 'rogues'],
    }

    matches = [class_name for class_name, aliases in class_aliases.items() if any(alias in normalized_title for alias in aliases)]
    if len(matches) == 1:
        return matches[0]
    return None


def normalize_class_spec(title: str, spec_name: str, class_name: str, phase: str | None = None) -> list[str]:
    normalized_title = normalize_text(title)
    normalized_spec = normalize_text(spec_name)
    normalized_phase = normalize_text(phase or '')

    if class_name.lower() == 'druid':
        if 'feral' in normalized_spec or 'feral' in normalized_title:
            if re.search(r'\b(tank|guardian|protection)\b', normalized_title):
                return ['Feral (Tank)']
            return ['Feral (DPS)']

        if normalized_spec in {'balance', 'balance druid'} or 'balance' in normalized_title:
            return ['Balance Druid']
        if normalized_spec in {'restoration', 'resto', 'resto druid'} or 'resto' in normalized_title:
            return ['Resto Druid']

    if class_name.lower() == 'priest':
        if 'healing priest' in normalized_spec or 'healing priest' in normalized_title:
            return ['Holy Priest', 'Discipline Priest']

    if class_name.lower() == 'rogue':
        if normalized_spec in {'rogue', 'rogues'} or 'rogue' in normalized_title:
            return ['Combat Rogue', 'Assassination Rogue', 'Subtlety Rogue']

    if class_name.lower() == 'warrior' and normalized_phase == 'pre-bis':
        if normalized_spec in {'dps warrior', 'dps'} or 'dps warrior' in normalized_title:
            return ['Arms Warrior', 'Fury Warrior']

    site_spec_map = {
        'Warrior': {
            'protection': 'Prot Warrior',
            'prot': 'Prot Warrior',
            'arms': 'Arms Warrior',
            'fury': 'Fury Warrior',
        },
        'Paladin': {
            'protection': 'Prot Paladin',
            'prot': 'Prot Paladin',
            'holy': 'Holy Paladin',
            'retribution': 'Ret Paladin',
            'ret': 'Ret Paladin',
        },
        'Hunter': {
            'beast mastery': 'BM Hunter',
            'beast-mastery': 'BM Hunter',
            'bm': 'BM Hunter',
            'marksmanship': 'MM Hunter',
            'mm': 'MM Hunter',
            'survival': 'Survival Hunter',
        },
        'Shaman': {
            'elemental': 'Elemental Shaman',
            'enhancement': 'Enhance Shaman',
            'restoration': 'Resto Shaman',
            'resto': 'Resto Shaman',
        },
        'Priest': {
            'discipline': 'Discipline Priest',
            'holy': 'Holy Priest',
            'shadow': 'Shadow Priest',
        },
        'Mage': {
            'arcane': 'Arcane Mage',
            'fire': 'Fire Mage',
            'frost': 'Frost Mage',
        },
        'Warlock': {
            'affliction': 'Affliction Warlock',
            'demonology': 'Demo Warlock',
            'destruction': 'Destro Warlock',
        },
        'Rogue': {
            'combat': 'Combat Rogue',
            'assassination': 'Assassination Rogue',
            'subtlety': 'Subtlety Rogue',
        },
    }

    class_map = site_spec_map.get(class_name)
    if class_map:
        for key, value in class_map.items():
            if key in normalized_spec or key in normalized_title:
                return [value]

    if spec_name and class_name:
        return [f'{spec_name} {class_name}']
    return [spec_name or class_name or '']


def infer_phase_from_title(title: str) -> str | None:
    normalized_title = normalize_text(title)

    if re.search(r'\bpre[- ]?raid\b', normalized_title):
        return 'Pre-BiS'

    phase_match = re.search(r'\bphase\s*(\d+)\b', normalized_title)
    if phase_match:
        phase_number = int(phase_match.group(1))
        if phase_number == 1:
            return 'T4'
        if phase_number == 2:
            return 'T5'
        if phase_number == 3:
            return 'T6'
        if phase_number == 4:
            return 'ZA'
        if phase_number == 5:
            return 'SWP'

    p_match = re.search(r'\bp(\d+)\b', normalized_title)
    if p_match:
        phase_number = int(p_match.group(1))
        if phase_number == 1:
            return 'T4'
        if phase_number == 2:
            return 'T5'
        if phase_number == 3:
            return 'T6'
        if phase_number == 4:
            return 'ZA'
        if phase_number == 5:
            return 'SWP'

    t_match = re.search(r'\bt(\d+)\b', normalized_title)
    if t_match:
        phase_number = int(t_match.group(1))
        if phase_number == 4:
            return 'T4'
        if phase_number == 5:
            return 'T5'
        if phase_number == 6:
            return 'T6'

    alias_match = re.search(r'\b(za|swp)\b', normalized_title)
    if alias_match:
        return alias_match.group(1).upper()

    return None


def resolve_phase_for_page(title: str, fallback_phase: str | None = None) -> str | None:
    normalized_title = normalize_text(title)
    inferred_phase = infer_phase_from_title(title)

    if inferred_phase:
        return inferred_phase

    return fallback_phase


def is_title_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    lowered = stripped.lower()
    if 'best in slot' not in lowered:
        return False

    ignored_phrases = [
        "welcome to wowhead's best in slot gear list",
        "we have created many different best in slot lists",
    ]
    if any(phrase in lowered for phrase in ignored_phrases):
        return False

    if '(bis)' in lowered or 'tbc' in lowered or 'burning crusade' in lowered or 'classic' in lowered:
        return True
    return False


def is_page_footer(line: str) -> bool:
    lowered = line.strip().lower()
    return lowered in {'privacy policy', 'terms of use'} or lowered.startswith('privacy policy') or lowered.startswith('terms of use')


def split_pages(text: str) -> list[tuple[str, str]]:
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    pages = []
    current_title = None
    current_lines = []

    for line in lines:
        stripped = line.strip()
        if is_title_line(stripped):
            if current_title is not None:
                pages.append((current_title, '\n'.join(current_lines)))
            current_title = stripped
            current_lines = [stripped]
            continue

        if current_title is not None:
            if is_page_footer(stripped):
                pages.append((current_title, '\n'.join(current_lines)))
                current_title = None
                current_lines = []
                continue
            current_lines.append(line)

    if current_title is not None:
        pages.append((current_title, '\n'.join(current_lines)))

    return pages


def parse_items(text: str) -> tuple[list[tuple[str, str]], set[str]]:
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    items = []
    current_block = []
    collecting = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('Rank\tItem\tSource'):
            collecting = True
            current_block = []
            continue

        if collecting:
            if stripped == '':
                if current_block:
                    items.extend(current_block)
                    current_block = []
                collecting = False
                continue

            if '\t' in stripped and not stripped.startswith('Other ') and not stripped.startswith('If you'):
                current_block.append(stripped)

    if current_block:
        items.extend(current_block)

    parsed = []
    unknown_ranks = set()
    for row in items:
        parts = [part.strip() for part in row.split('\t') if part.strip()]
        if len(parts) < 2:
            continue
        rank = parts[0]
        item_name = parts[1]
        normalized_rank = rank.lower()

        lowered_rank = normalized_rank
        if 'alternative' in lowered_rank or 'option' in lowered_rank or 'pvp' in lowered_rank:
            normalized_rank = 'optional'
        elif 'optional' in lowered_rank or 'good' in lowered_rank or 'mediocre' in lowered_rank:
            normalized_rank = 'optional'
        elif 'bis' in lowered_rank:
            normalized_rank = 'bis'
        elif 'best' in lowered_rank and 'alternative' not in lowered_rank and 'second best' not in lowered_rank and '2nd best' not in lowered_rank and 'next best' not in lowered_rank:
            normalized_rank = 'bis'
        else:
            normalized_rank = 'optional'

        if normalized_rank == 'bis':
            parsed.append(('BiS', item_name))
        else:
            parsed.append(('Option', item_name))
            if rank.lower() not in {'bis', 'best', 'option', 'optional', 'alternative', 'good', 'mediocre', 'pvp'}:
                unknown_ranks.add(rank)
    return parsed, unknown_ranks


def build_completeness_report(expected_combinations: list[tuple[str, str]], actual_combinations: list[tuple[str, str]]) -> dict:
    actual_set = set(actual_combinations)
    expected_set = set(expected_combinations)
    missing = sorted(expected_set - actual_set)
    return {
        'is_complete': not missing,
        'missing_count': len(missing),
        'missing_combinations': missing,
    }


rows = []
errors = []
seen_combinations = set()
unknown_rank_log = set()

for class_dir in sorted(bis_root.iterdir()):
    if not class_dir.is_dir():
        continue

    known_specs = discover_known_specs(class_dir)
    if not known_specs:
        continue

    for txt_path in sorted(class_dir.rglob('*.txt')):
        if not txt_path.exists():
            continue
        if txt_path.name.lower().startswith('pre-raid') and txt_path.name.lower().endswith('items.txt'):
            continue

        text = txt_path.read_text(encoding='utf-8-sig', errors='replace')
        if not text.strip():
            continue

        file_phase = None
        for title, page_text in split_pages(text):
            phase = resolve_phase_for_page(title, file_phase)
            class_name = derive_class_name(txt_path)
            folder_spec = txt_path.parent.name
            spec = infer_spec_from_title(title, known_specs) or folder_spec

            if infer_phase_from_title(title):
                file_phase = phase

            title_class = infer_class_from_title(title)
            if title_class and class_name and title_class.lower() != class_name.lower():
                errors.append({
                    'source_file': txt_path.relative_to(root).as_posix(),
                    'title': title,
                    'reason': 'wrong class',
                    'details': f'expected_class={class_name}; title_class={title_class}'
                })
                continue

            if not spec or not phase:
                errors.append({
                    'source_file': txt_path.relative_to(root).as_posix(),
                    'title': title,
                    'reason': 'missing spec' if not spec else 'missing phase',
                    'details': f'spec={spec or "unknown"}; phase={phase or "unknown"}'
                })
                continue

            parsed_rows, unknown_ranks = parse_items(page_text)
            for rank, item_name in parsed_rows:
                for class_spec in normalize_class_spec(title, spec, class_name, phase):
                    rows.append({
                        'rank': rank,
                        'item_name': item_name,
                        'class_spec': class_spec,
                        'phase': phase,
                    })
                    seen_combinations.add((class_spec, phase))
            if unknown_ranks:
                unknown_rank_log.update(unknown_ranks)

with output_path.open('w', newline='', encoding='utf-8') as handle:
    writer = csv.DictWriter(handle, fieldnames=['rank', 'item_name', 'class_spec', 'phase'])
    writer.writeheader()
    writer.writerows(rows)

with error_path.open('w', newline='', encoding='utf-8') as handle:
    writer = csv.DictWriter(handle, fieldnames=['source_file', 'title', 'reason', 'details'])
    writer.writeheader()
    writer.writerows(errors)

all_phases = ['Pre-BiS', 'T4', 'T5', 'T6', 'ZA', 'SWP']
all_specs = [
    'Holy Priest', 'Discipline Priest', 'Shadow Priest',
    'Combat Rogue', 'Assassination Rogue', 'Subtlety Rogue',
    'Arms Warrior', 'Fury Warrior', 'Prot Warrior',
    'Prot Paladin', 'Holy Paladin', 'Ret Paladin',
    'BM Hunter', 'MM Hunter', 'Survival Hunter',
    'Elemental Shaman', 'Enhance Shaman', 'Resto Shaman',
    'Arcane Mage', 'Fire Mage', 'Frost Mage',
    'Affliction Warlock', 'Demo Warlock', 'Destro Warlock',
    'Balance Druid', 'Feral (DPS)', 'Feral (Tank)', 'Resto Druid',
]
expected_combinations = [(spec, phase) for spec in all_specs for phase in all_phases]
completeness_report = build_completeness_report(expected_combinations, sorted(seen_combinations))

unknown_rank_path = bis_root / 'unknown-ranks.csv'
with unknown_rank_path.open('w', newline='', encoding='utf-8') as handle:
    writer = csv.writer(handle)
    writer.writerow(['rank'])
    for rank in sorted(unknown_rank_log):
        writer.writerow([rank])

with completeness_path.open('w', newline='', encoding='utf-8') as handle:
    writer = csv.DictWriter(handle, fieldnames=['spec', 'phase', 'covered'])
    writer.writeheader()
    for spec, phase in sorted(expected_combinations):
        covered = (spec, phase) in seen_combinations
        writer.writerow({'spec': spec, 'phase': phase, 'covered': 'yes' if covered else 'no'})

print(f'Wrote {len(rows)} rows to {output_path}')
print(f'Wrote {len(errors)} errors to {error_path}')
print(f'Wrote unknown ranks report to {unknown_rank_path}')
print(f'Wrote completeness report to {completeness_path}')
print(f'Completeness: {"complete" if completeness_report["is_complete"] else "incomplete"} ({len(expected_combinations) - completeness_report["missing_count"]}/{len(expected_combinations)} combinations covered)')
if completeness_report['missing_combinations']:
    print('Missing combinations:')
    for spec, phase in completeness_report['missing_combinations']:
        print(f' - {spec} / {phase}')
