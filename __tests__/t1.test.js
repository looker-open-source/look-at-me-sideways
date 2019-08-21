/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/t1.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('T1', () => {
		let failMessageT1 = {
			rule: 'T1',
			exempt: false,
			level: 'error',
		};

		let passMessageT1 = {
			rule: 'T1',
			level: 'info',
		};

		it('should pass if datagroup_trigger or persist_for is used', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						datagroup_trigger: my_datagroup
					}
				}
			}`));
			expect(result).toContainMessage(passMessageT1);

			result = rule(parse(`files:{} files:{
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						persist_for: "24 hours"
					}
				}
			}`));
			expect(result).toContainMessage(passMessageT1);
		});

		it('should not error on DTs', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
					}
				}
			}`));
			expect(result).toContainMessage(passMessageT1);
		});

		it('should error if sql_trigger_value is used', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					derived_table: {
						sql: SELECT * 
						FROM table ;;
						sql_trigger_value: SELECT CURDATE() ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageT1);
		});
	});
});
