/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../lib/expect-to-contain-message');

const rule = require('../rules/k7');
const {parse} = require('lookml-parser');


let K7 = {rule: 'K7'};
let error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	...K7,
	level: 'info',
	description: `Rule K7 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('K7', () => {
		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no views', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should pass if the view appears to have no associated table', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: foo_field {}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...K7, ...error});
		});

		it('should pass if one primary_key is defined', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk1_foo_id {primary_key:yes}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...K7, ...error});
		});

		it('should fail if no pk is defined', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: foo_field {}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K7, ...error});
		});

		it('should pass if no pk is defined, but a pk0 is declared', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk0_foo {}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...K7, ...error});
		});

		it('should fail if no pk is defined, including primary_key:no', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: foo_field { primary_key: no }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K7, ...error});
		});

		it('should fail if multiple pk\'s are defined', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk2_fo_id { primary_key: yes }
					dimension: pk2_oo_id { primary_key: yes }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K7, ...error});
		});
	});
});
