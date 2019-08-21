/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f1');
const {parse} = require('lookml-parser');


describe('Rules', () => {
	describe('F1', () => {
		let failMessageF1 = {
			rule: 'F1',
			exempt: false,
			level: 'error',
		};

		it('should not error if there are no files', () => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`files:{} files:{}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for a view with no fields', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { sql_table_name: foo ;; }
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for a view with no table (a.k.a. field-only view)', () => {
			let result = rule(parse(`files:{} files:{
				view: foo_bar { 
					dimension: combine { sql: \${foo.amount} + \${bar.amount} ;; } 
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for a field with no references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: foo { sql: 1 ;; }
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should error for a base-table view with a cross-view reference', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a derived-table view with a cross-view reference', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					derived_table: { sql: SELECT 1 ;;}
					dimension: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for an extended view with a cross-view reference', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a view with cross-view references in measures', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					measure: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a view with cross-view references in filters', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					filter: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should not error for an F1 exempted view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					rule_exemptions: {F1:"It is okay, this is extended."}
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should error for an F1 exempted view if no reason is specified', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					rule_exemptions: {F1:""}
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					rule_exemptions: [X1]
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should not error for an F1 exempted field', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					dimension: baz { 
						sql: \${abc.xyz} ;; 
						rule_exemptions: {F1: "It is okay, this is extended"}
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					dimension: baz {
						sql: \${abc.xyz} ;;
						rule_exemptions: [X1]
					}
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should not error for an F1 exempted project', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					dimension: baz { 
						sql: \${abc.xyz} ;; 
					}
				}
			}
			file: manifest {rule_exemptions: {F1: "It is okay, this is extended"}}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should error for an otherwise exempted project', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					extends: [bar]
					dimension: baz {
						sql: \${abc.xyz} ;;
					}
				}
			}
			files: manifest {rule_exemptions: {X1: "Different exemption"}}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a field with a non-special-case 2-part reference in sql {{}}', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {{baz.bat}} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a field with a non-special-case 2-part reference in sql {% %}', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {%parameter baz.bat %} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a field with a non-special-case 2-part reference in html ${}', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a field with a non-special-case 2-part reference in html {{}}', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: {{baz.bat}} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for a field with a non-special-case 2-part reference in html {% %}', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: {%parameter baz.bat %} ;; }
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should not error for a field with a TABLE reference', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: foo { sql: \${TABLE.foo} ;; }
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for references to its own default alias', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: \${foo.bar} ;; }
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for 2-part ._sql references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._sql}} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for 2-part ._value references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._value}} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for 2-part ._name references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._name}} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for 2-part ._parameter_value references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					parameter: bar {}
					dimension: baz { sql: {{bar._parameter_value}} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should error for 2-part ._in_query references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: baz { sql: {{bar._in_query}} ;;}
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should error for 3-part cross-view special-suffix references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {{bat.baz._value}} ;;}
				}
			}`));
			expect(result).toContainMessage(failMessageF1);
		});

		it('should not error for 3-part same-view special-suffix references', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar {}
					dimension: baz { sql: {{foo.bar._value}} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for decimal numbers that look kind of like fields', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { type: number }
					dimension: baz { type: yesno sql: \${bar} > 3.14;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});

		it('should not error for decimal numbers that look kind of like fields in liquid', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					sql_table_name: foo ;;
					dimension: rad {}
					dimension: rot { sql: {% if value > 3.14 %} \${rad}/3.14 ||' rot' {% else %} \${rad}||' rad' {% endif %} ;;}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF1);
		});
	});
});
