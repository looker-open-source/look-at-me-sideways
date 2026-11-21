/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const rule = require('./index.js');
const {parse} = require('lookml-parser');
require('../../lib/expect-to-contain-message');


let K3 = {rule: 'K3'};
let error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	level: 'info',
	description: `Rule K3 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});


describe('Rules', () => {
	describe('K3', () => {
		it('should pass if pks are defined first in view file', () => {
			let result = rule(parse(`file: {} file: {
				view: foo {
					sql_table_name: bar ;;
					dimension: 1pk_baz {}
				}
			}`));
			expect(result).toContainMessage({...K3, ...summary(1, 0, 0)});
			expect(result).not.toContainMessage({...K3, ...error});
		});

		it('should error if pks are not defined first in view file', () => {
			let result = rule(parse(`file: {} file: {
				view: foo {
					sql_table_name: bar ;;
					dimension: baz {}
					dimension: 1pk_qux {}
				}
			}`));
			expect(result).toContainMessage({...K3, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K3, ...error});
		});

		it('should pass if a composite primary_key dimension is declared before PK dimensions', () => {
			let result = rule(parse(`file: {} file: {
				view: foo {
					sql_table_name: bar ;;
					dimension: pk {
						primary_key: yes
						hidden: yes
					}
					dimension: pk2_baz {}
					dimension: pk2_qux {}
					dimension: other {}
				}
			}`));
			expect(result).toContainMessage({...K3, ...summary(1, 0, 0)});
			expect(result).not.toContainMessage({...K3, ...error});
		});

		it('should error if a non-PK dimension is declared before composite primary_key and PK dimensions', () => {
			let result = rule(parse(`file: {} file: {
				view: foo {
					sql_table_name: bar ;;
					dimension: other {}
					dimension: pk {
						primary_key: yes
						hidden: yes
					}
					dimension: pk2_baz {}
					dimension: pk2_qux {}
				}
			}`));
			expect(result).toContainMessage({...K3, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...K3, ...error});
		});
	});
});
