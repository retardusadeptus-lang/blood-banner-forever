import json

with open('aggregated_bis_with_ids.json', 'r') as f:
    data = json.load(f)

unique_specs = sorted(set(item['spec'] for item in data if 'spec' in item))

with open('specs.txt', 'w') as f:
    for spec in unique_specs:
        f.write(spec + '\n')
    f.write(f'\nTotal unique specs: {len(unique_specs)}\n')

print(f"Done — {len(unique_specs)} unique specs written to specs.txt")