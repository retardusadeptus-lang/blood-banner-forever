import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import extract_bis_items


class NormalizeClassSpecTests(unittest.TestCase):
    def test_healing_priest_maps_to_both_priest_specs(self):
        self.assertEqual(
            extract_bis_items.normalize_class_spec('Best in Slot Healing Priest', 'healing priest', 'Priest'),
            ['Holy Priest', 'Discipline Priest'],
        )

    def test_rogue_title_maps_to_all_rogue_specs(self):
        self.assertEqual(
            extract_bis_items.normalize_class_spec('Best in Slot Rogue', 'rogue', 'Rogue'),
            ['Combat Rogue', 'Assassination Rogue', 'Subtlety Rogue'],
        )

    def test_dps_warrior_pre_bis_maps_to_arms_and_fury(self):
        self.assertEqual(
            extract_bis_items.normalize_class_spec('Best in Slot Pre-Raid Gear Recommendations for DPS Warrior', 'dps warrior', 'Warrior', 'Pre-BiS'),
            ['Arms Warrior', 'Fury Warrior'],
        )

    def test_build_completeness_report_flags_missing_combinations(self):
        report = extract_bis_items.build_completeness_report(
            expected_combinations=[('Holy Priest', 'Pre-BiS'), ('Holy Priest', 'T4'), ('Discipline Priest', 'T4')],
            actual_combinations=[('Holy Priest', 'Pre-BiS'), ('Discipline Priest', 'T4')],
        )
        self.assertFalse(report['is_complete'])
        self.assertEqual(report['missing_count'], 1)
        self.assertEqual(report['missing_combinations'], [('Holy Priest', 'T4')])

    def test_parse_items_reports_unknown_ranks(self):
        parsed_rows, unknown_ranks = extract_bis_items.parse_items(
            'Rank\tItem\tSource\nGood\tExample Item\tExample Source\nBiS\tBest Item\tExample Source\n'
        )
        self.assertEqual(parsed_rows, [('BiS', 'Best Item')])
        self.assertEqual(unknown_ranks, {'Good'})


if __name__ == '__main__':
    unittest.main()
