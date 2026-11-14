/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const rule = require('./index.js');
const {parse} = require('lookml-parser');
require('../../lib/expect-to-contain-message');


let K4 = {rule: 'K4'};
let error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	level: 'info',
	description: `Rule K4 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});


describe('Rules', () => {
	describe('K4', () => {
		it('should pass if all pks are hidden', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					dimension: pk_baz { hidden: yes }
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 0)});
			expect(result).not.toContainMessage({...K4, ...error});
		});

		it('should error if the pk is not hidden', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk_foo_id {}
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K4, ...error});
		});

		it('should error if any of multiple pks is not hidden', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					dimension: pk2_baz { hidden: yes }
					dimension: pk2_qux {}
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K4, ...error});
		});

		it('should error if any of multiple pks are unhidden, explicitly', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					dimension: pk_baz { hidden: yes }
					dimension: pk_qux { hidden: no}
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K4, ...error});
		});

		it('it may emit more than one error per match', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					dimension: pk_baz { hidden: no }
					dimension: pk_qux { hidden: no}
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 2)});
			expect(result).toContainMessage({...K4, ...error});
		});

		it('should pass when pk is hidden via fields_hidden_by_default', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					fields_hidden_by_default: yes
					dimension: pk_baz {}
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 0)});
			expect(result).not.toContainMessage({...K4, ...error});
		});

		it('should error when pk overrides fields_hidden_by_default with hidden: no', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: bar ;;
					fields_hidden_by_default: yes
					dimension: pk_baz { hidden: no }
				}
			}`));
			expect(result).toContainMessage({...K4, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K4, ...error});
		});
	});
});
