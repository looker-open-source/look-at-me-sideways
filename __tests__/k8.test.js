/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../lib/expect-to-contain-message');

const rule = require('../rules/k8');
const {parse} = require('lookml-parser');


let K8 = {rule: 'K8'};
let error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	...K8,
	level: 'info',
	description: `Rule K8 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('K8', () => {
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

		it('should not match and pass if there are no primary_key dimensions', () => {
			let result = rule(parse(`model: foo { view: bar { dimension: baz {}}}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should pass if the primary_key dimension is a 1-PK-named dimension', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk1_foo_id { primary_key: yes }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...K8, ...error});
		});

		it('should pass if the primary_key dimension uses all PK-named dimensions', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk3_foo_id {}
					dimension: pk3_bar_id {}
					dimension: pk3_baz_id {}
					dimension: id {
						primary_key: yes
						sql: \${pk3_foo_id} || \${pk3_bar_id} || \${pk3_baz_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...K8, ...error});
		});

		// // Not sure if anyone would ever do anything like this, or if it needs to be caught by this rule,
		// // but at the moment, we let anything named like pk1_* pass, no matter how silly
		//
		// it('should fail if the primary_key dimension is a 1-PK-named dimension referencing a PK dimension', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			sql_table_name: foo ;;
		// 			dimension: pk1_foo_id { primary_key: yes sql: \${pk1_bar_id} ;;}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage(summary(1, 0, 1));
		// 	expect(result).toContainMessage({...K8, ...error});
		// });

		it('should fail if the primary_key dimension does not reference PK dimensions', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk3_foo_id {}
					dimension: pk3_bar_id {}
					dimension: pk3_baz_id {}
					dimension: id {
						primary_key: yes
						sql: \${TABLE}.id ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K8, ...error});
		});

		it('should fail if the primary_key dimension references inconsistent PK dimension sizes', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk3_foo_id {}
					dimension: pk3_bar_id {}
					dimension: pk3_baz_id {}
					dimension: id {
						primary_key: yes
						sql: \${pk1_foo_id} || \${pk2_bar_id} || \${pk3_baz_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K8, ...error});
		});

		it('should fail if the primary_key dimension does not reference enough PK dimensions', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: pk3_foo_id {}
					dimension: pk3_bar_id {}
					dimension: pk3_baz_id {}
					dimension: id {
						primary_key: yes
						sql: \${pk3_foo_id} || \${pk3_baz_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...K8, ...error});
		});
	});
});
