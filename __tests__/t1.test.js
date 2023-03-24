/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/t1.js');
const {parse} = require('lookml-parser');

const T1 = {rule: 'T1'};
const error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	level: 'info',
	description: `Rule T1 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('T1', () => {
		it('should pass if datagroup_trigger is used', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						datagroup_trigger: my_datagroup
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...T1, ...error});
		});

		it('should pass if persist_for is used', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						persist_for: "24 hours"
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...T1, ...error});
		});

		it('should not error on ephemeral DTs', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...T1, ...error});
		});

		it('should error if sql_trigger_value is used', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						sql_trigger_value: SELECT CURDATE() ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...T1, ...error});
		});
	});
});
