/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const rule = require('../rules/k1-2-3-4');
const {parse} = require('lookml-parser');
require('../lib/expect-to-contain-message');

describe('Rules', () => {
	describe('K1', () => {
		let failMessageK1 = {
			rule: 'K1',
			exempt: false,
			level: 'error',
		};

		let passMessageK1 = {
			rule: 'K1',
			level: 'info',
		};

		it('should pass if any pk is defined using [0-9]pk_.* or pk[0-9]_.*', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: pk2_baz {}
				}
			}`));
			expect(result).toContainMessage(passMessageK1);
			expect(result).not.toContainMessage(failMessageK1);
		});

		it('should error if any pk is defined incorrectly using [0-9]pk[0-9]_.*', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 2pk2_baz {}
				}
			}`));
			expect(result).toContainMessage(failMessageK1);
		});

		it('should not error if no pk is found and file is exempt from rule', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					rule_exemptions: {K1: "Who cares about primary keys"}
					dimension: baz {}
					dimension: qux {}
				}
			}`));
			expect(result).toContainMessage({...failMessageK1, exempt: expect.any(String)});
		});


		it('should not error if no pk is found and project is exempt from the rule', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: baz {}
					dimension: qux {}
				}
			}
			file: manifest {rule_exemptions: {K1: "It's ok, exempt"}}`));
			expect(result).toContainMessage({exempt: expect.any(String)});
		});

		it('should error if no pk is found and project is exempt from another rule', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: baz {}
					dimension: qux {}
				}
			}
			file: manifest {rule_exemptions: {X1: "Different exemption"}}`));
			expect(result).toContainMessage(failMessageK1);
		});
		it('should not error if there is no sql_table_name', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {}
					dimension: baz {}
				}
			}`));
			expect(result).toContainMessage(passMessageK1);
			expect(result).not.toContainMessage(failMessageK1);
		});
	});

	describe('K2', () => {
		let passMessageK2 = {
			rule: 'K2',
			level: 'info',
		};

		let failMessageK2 = {
			rule: 'K2',
			exempt: false,
			level: 'error',
		};

		it('should pass if all pks are prefixed with the same {n}pk|pk{n} in a given view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 1pk_baz {}
				}
			}`));
			expect(result).toContainMessage(passMessageK2);
			expect(result).not.toContainMessage(failMessageK2);
		});

		it('should pass if number of pks matches {n} in {n}pk', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 2pk_baz {}
					dimension: 2pk_qux {}
				}
			}`));
			expect(result).toContainMessage(passMessageK2);
			expect(result).not.toContainMessage(failMessageK2);
		});

		it('should not error if pks are defined using different prefixes in a given view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 2pk_baz {}
					dimension: pk2_qux {}
				}
			}`));
			expect(result).toContainMessage(passMessageK2);
			expect(result).not.toContainMessage(failMessageK2);
		});

		it('should error if number of pks does not match {n} in {n}pk', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 3pk_baz {}
					dimension: 3pk_qux {}
				}
			}`));
			expect(result).toContainMessage(failMessageK2);
		});
	});

	describe('K3', () => {
		let passMessageK3 = {
			rule: 'K3',
			level: 'info',
		};

		let failMessageK3 = {
			rule: 'K3',
			exempt: false,
			level: 'warning',
		};

		it('should pass if pks are defined first in view file', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 1pk_baz {}
				}
			}`));
			expect(result).toContainMessage(passMessageK3);
			expect(result).not.toContainMessage(failMessageK3);
		});

		it('should warn if pks are not defined first in view file', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: baz {}
					dimension: 1pk_qux {}
				}
			}`));
			expect(result).toContainMessage(failMessageK3);
		});
	});

	describe('K4', () => {
		let passMessageK4 = {
			rule: 'K4',
			level: 'info',
		};

		let failMessageK4 = {
			rule: 'K4',
			exempt: false,
			level: 'warning',
		};

		it('should pass if all pks are hidden', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 1pk_baz { hidden: yes }
				}
			}`));
			expect(result).toContainMessage(passMessageK4);
			expect(result).not.toContainMessage(failMessageK4);
		});

		it('should warn if any pk is not hidden', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: bar ;;
					dimension: 2pk_baz { hidden: yes }
					dimension: 2pk_qux {}
				}
			}`));
			expect(result).toContainMessage(failMessageK4);
		});
	});
});
