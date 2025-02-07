/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/h3.js');
const {parse} = require('lookml-parser');
const r='H3'

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let verbose = {level: 'verbose'};
		let h3 = {rule: 'H3'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no views', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with too many dimension_groups', () => {
			let result = rule(parse(`model: m {
				view: my_view {
					dimension_group: dg1 {} dimension_group: dg2 {} dimension_group: dg3 {}
					dimension_group: dg4 {} dimension_group: dg5 {} dimension_group: dg6 {}
					dimension_group: dg7 {} dimension_group: dg8 {} dimension_group: dg9 {}
					dimension_group: dg10 {} dimension_group: dg11 {}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h3, ...error});
		});

		it('should pass views with <=10 dimension_groups', () => {
			let result = rule(parse(`model: m {
				view: my_view {
					dimension_group: dg1 {} dimension_group: dg2 {} dimension_group: dg3 {}
					dimension_group: dg4 {} dimension_group: dg5 {} dimension_group: dg6 {}
					dimension_group: dg7 {} dimension_group: dg8 {} dimension_group: dg9 {}
					dimension_group: dg10 {} 
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views with hidden dimension_groups', () => {
			let result = rule(parse(`model: m {
				view: my_view {
					dimension_group: dg1 {} dimension_group: dg2 {} dimension_group: dg3 {}
					dimension_group: dg4 {} dimension_group: dg5 {} dimension_group: dg6 {}
					dimension_group: dg7 {} dimension_group: dg8 {} dimension_group: dg9 {}
					dimension_group: dg10 {} dimension_group: dg11 {hidden: yes}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with too many group_labels among dimensions', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: g1d1 {group_label: "G1"} dimension: g1d2 {group_label: "G1"}
					dimension: g2d1 {group_label: "G2"} dimension: g2d2 {group_label: "G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g10d1 {group_label: "G10"} dimension: g10d2 {group_label: "G10"}
					dimension: g11d1 {group_label: "G11"} dimension: g11d2 {group_label: "G11"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h3, ...error});
		});

		it('should pass views with <=10 group_labels_among dimensions>', () => {
			let result = rule(parse(`model: m {
				view: my_view {
					dimension: g1d1 {group_label: "G1"} dimension: g1d2 {group_label: "G1"}
					dimension: g2d1 {group_label: "G2"} dimension: g2d2 {group_label: "G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g9d1 {group_label: "G10"} dimension: g9d2 {group_label: "G10"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail twice with too many dimensions and too many measures', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: g1d1 {group_label: "G1"} dimension: g1d2 {group_label: "G1"}
					dimension: g2d1 {group_label: "G2"} dimension: g2d2 {group_label: "G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g10d1 {group_label: "G10"} dimension: g10d2 {group_label: "G10"}
					dimension: g11d1 {group_label: "G11"} dimension: g11d2 {group_label: "G11"}
					
					measure: g1m1 {group_label: "G1"} measure: g1m2 {group_label: "G1"}
					measure: g2m1 {group_label: "G2"} measure: g2m2 {group_label: "G2"}
					measure: g3m1 {group_label: "G3"} measure: g3m2 {group_label: "G3"}
					measure: g4m1 {group_label: "G4"} measure: g4m2 {group_label: "G4"}
					measure: g5m1 {group_label: "G5"} measure: g5m2 {group_label: "G5"}
					measure: g6m1 {group_label: "G6"} measure: g6m2 {group_label: "G6"}
					measure: g7m1 {group_label: "G7"} measure: g7m2 {group_label: "G7"}
					measure: g8m1 {group_label: "G8"} measure: g8m2 {group_label: "G8"}
					measure: g9m1 {group_label: "G9"} measure: g9m2 {group_label: "G9"}
					measure: g10m1 {group_label: "G10"} measure: g10m2 {group_label: "G10"}
					measure: g11m1 {group_label: "G11"} measure: g11m2 {group_label: "G11"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 2 errors`,
			});
			expect(result).toContainMessage({...h3, ...error});
		});

		it('should pass views using sort groups to comply with the threshold', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: g1d1 {group_label: "A > G1"} dimension: g1d2 {group_label: "A > G1"}
					dimension: g2d1 {group_label: "A > G2"} dimension: g2d2 {group_label: "A > G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g9d1 {group_label: "G10"} dimension: g9d2 {group_label: "G10"}
					dimension: g9d1 {group_label: "G11"} dimension: g9d2 {group_label: "G11"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with sort groups that don\'t help to comply with the threshold>', () => {
			let result = rule(parse(`model: m {
				view: my_view {
					dimension: g1d1 {group_label: "A > G1"} dimension: g1d2 {group_label: "A > G1"}
					dimension: g2d1 {group_label: "G2"} dimension: g2d2 {group_label: "G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g10d1 {group_label: "G10"} dimension: g10d2 {group_label: "G10"}
					dimension: g11d1 {group_label: "G11"} dimension: g11d2 {group_label: "G11"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h3, ...error});
		});

		it('should pass views using custom-delimiter sort-grouping to comply with the threshold>', () => {
			let result = rule(parse(`
			manifest: {rule: H3 {options: {delimiter: ": "}}}
			model: m {
				view: accounts {
					dimension: g1d1 {group_label: "A: G1"} dimension: g1d2 {group_label: "A: G1"}
					dimension: g2d1 {group_label: "A: G2"} dimension: g2d2 {group_label: "A: G2"}
					dimension: g3d1 {group_label: "G3"} dimension: g3d2 {group_label: "G3"}
					dimension: g4d1 {group_label: "G4"} dimension: g4d2 {group_label: "G4"}
					dimension: g5d1 {group_label: "G5"} dimension: g5d2 {group_label: "G5"}
					dimension: g6d1 {group_label: "G6"} dimension: g6d2 {group_label: "G6"}
					dimension: g7d1 {group_label: "G7"} dimension: g7d2 {group_label: "G7"}
					dimension: g8d1 {group_label: "G8"} dimension: g8d2 {group_label: "G8"}
					dimension: g9d1 {group_label: "G9"} dimension: g9d2 {group_label: "G9"}
					dimension: g9d1 {group_label: "G10"} dimension: g9d2 {group_label: "G10"}
					dimension: g9d1 {group_label: "G11"} dimension: g9d2 {group_label: "G11"}
				}
			}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

	});
});
