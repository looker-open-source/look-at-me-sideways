/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f1');
const {parse} = require('lookml-parser');


let F1 = {rule: 'F1'};
let error = {level: 'error'};
let summary = (m=1, ex=0, er=1) => ({
	rule: 'F1',
	level: 'info',
	description: `Rule F1 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('F1', () => {
		it('should not error if the project is empty', () => {
			let result = rule(parse(``));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`model: my_model {}`));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for a view with no fields', () => {
			let result = rule(parse(`model: my_model {
				view: foo { sql_table_name: foo ;; }
			}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for a view with no table (a.k.a. field-only view)', () => {
			let result = rule(parse(`model: my_model {
				view: foo_bar { 
					dimension: combine { sql: \${foo.amount} + \${bar.amount} ;; } 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for a field with no references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: foo { sql: 1 ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for a base-table view with a cross-view reference', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a derived-table view with a cross-view reference', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					derived_table: { sql: SELECT 1 ;;}
					dimension: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		// TODO: Expose assembleModels from parser to test extensions here without full parseFiles & dummy project test case
		// it('should error for an extended view with a cross-view reference', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			extends: [bar]
		// 			dimension: baz { sql: \${abc.xyz} ;; }
		// 		}
		// 		view: bar {
		// 			sql_table_name: foo ;;
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage(summary(1, 0, 1));
		// 	expect(result).toContainMessage({...F1, ...error});
		// });

		it('should error for a view with cross-view references in measures', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					measure: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a view with cross-view references in filters', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					filter: bar { sql: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for an F1 exempted view', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					rule_exemptions: {F1:"It's okay"}
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 1, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for an F1 exempted view if no reason is specified', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					rule_exemptions: {F1:""}
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					rule_exemptions: {X1: "Other rule"}
					dimension: baz { sql: \${abc.xyz} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for an F1 exempted field', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: baz { 
						sql: \${abc.xyz} ;; 
						rule_exemptions: {F1: "It's okay"}
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 1, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: baz {
						sql: \${abc.xyz} ;;
						rule_exemptions: {X1: "Other"}
					}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		// Note: Need to decide if this style of test still makes sense, since for performance reasons, we prefer to
		//   short-circuit the entire rule application in case of project-level exemptions (and if we want to test it
		//   with a manually called rule anyway, we would need to apply a redundant check in rule-match-evaluator.js)
		//
		// it('should not error for an F1 exempted project', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			sql_table_name: foo ;;
		// 			dimension: baz {
		// 				sql: \${abc.xyz} ;;
		// 			}
		// 		}
		// 	}
		// 	manifest: {rule_exemptions: {F1: "It's okay"}}`));
		// 	expect(result).not.toContainMessage(error);
		// });

		// it('should error for an otherwise exempted project', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			sql_table_name: foo ;;
		// 			dimension: baz {
		// 				sql: \${abc.xyz} ;;
		// 			}
		// 		}
		// 	}
		// 	files: manifest {rule_exemptions: {X1: "Different exemption"}}`));
		// 	expect(result).toContainMessage(summary(1, 0, 1));
		// 	expect(result).toContainMessage({...F1, ...error});
		// });

		it('should error for a field with a non-special-case 2-part reference in sql {{}}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {{baz.bat}} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a field with a non-special-case 2-part reference in sql {% %}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {%parameter baz.bat %} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a field with a non-special-case 2-part reference in html ${}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: \${baz.bat} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a field with a non-special-case 2-part reference in html {{}}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: {{baz.bat}} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a field with a non-special-case 2-part reference in html {% %}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { html: {%parameter baz.bat %} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for a field with a TABLE reference', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: foo { sql: \${TABLE.foo} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for references to its own default alias', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: \${foo.bar} ;; }
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._sql references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._sql}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._value references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._value}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._name references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: 1 ;; }
					dimension: baz { sql: {{baz._name}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._parameter_value references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					parameter: bar {}
					dimension: baz { sql: {{bar._parameter_value}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._rendered_value references', () => {
			let result = rule(parse(`model: my_model {
				view: foobar {
					sql_table_name: foobar ;;
					dimension: foo {}
					dimension: bar { html: <b>{{foo._rendered_value}}</b> ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for 2-part ._link references', () => {
			let result = rule(parse(`model: my_model {
				view: foobar {
					sql_table_name: foobar ;;
					dimension: foo { drill_fields: [foo]}
					dimension: bar { link: {label: "Magic" url: "{{foo._link}}"}}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for special-case 2-part references, even when there is additional whitespace', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar1 { sql: 1 ;; }
					dimension: baz2 { sql: {{  baz._sql  }} ;;}
					dimension: baz3 { sql: {{  baz._value  }} ;;}
					dimension: baz5 { sql: {{ bar._parameter_value	 }} ;;}
					dimension: baz6 { sql: {{ baz._name
					 }} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(5, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for 2-part ._in_query references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: baz { sql: {{bar._in_query}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for 3-part cross-view special-suffix references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { sql: {{bat.baz._value}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for 3-part same-view special-suffix references', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar {}
					dimension: baz { sql: {{foo.bar._value}} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for decimal numbers that look kind of like fields', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { type: number }
					dimension: baz { type: yesno sql: \${bar} > 3.14;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for decimal numbers that look kind of like fields in liquid', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: rad {}
					dimension: rot { sql: {% if value > 3.14 %} \${rad}/3.14 ||' rot' {% else %} \${rad}||' rad' {% endif %} ;;}
				}
			}`));
			expect(result).toContainMessage(summary(2, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for a field with a 2-part reference in label_from_parameter', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { label_from_parameter: baz.bat }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for a field with a 1-part reference in label_from_parameter', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { label_from_parameter: bat }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for a field with a non-special-case 2-part reference in link > url', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						link: { url: "http://mysite.example.com/{{baz.bat}}" }
					} 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should error for a field with a non-special-case 2-part reference in link > icon_url', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						link: { icon_url: "http://mysite.example.com/{{baz.bat}}" }
					} 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for a field with a 1-part reference in link > url', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						link: { url: "http://mysite.example.com/{{bat}}" }
					} 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for a field with a special-case 2-part reference in link > url', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						link: { url: "http://mysite.example.com/{{bat._value}}" }
					} 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for a field with no-reference in link > icon_url', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						link: { icon_url: "http://mysite.example.com/favicon.ico" }
					} 
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should error for a field with a 2-part reference in filter (deprecated syntax)', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					measure: bar { filter: { field:bat.bax value: "0" } }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		it('should not error for a field with a 1-part reference in filter (deprecated syntax)', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					measure: bar { filter: { field:bat value:"0" } }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage(error);
		});

		it('should not error for fields with multiple references in html {% %}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						html: {% if bat._value == "usd" or bat._value == "cad" %}
							<p>\${{rendered_value}}</p>
							{% elsif bat._value == "eur" %}
							<p>€{{rendered_value}}</p>
							{% else %}
							<p>{{rendered_value}}</p>
							{% endif %} ;;
						}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).toContainMessage({...F1});
		});

		it('should error for 3-part cross-view special-suffix with multiple references in html {% %}', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					sql_table_name: foo ;;
					dimension: bar { 
						html: {% if bat._value == "usd" or baz.bat._value == "cad" %}
							<p>\${{rendered_value}}</p>
							{% elsif bat._value == "eur" %}
							<p>€{{rendered_value}}</p>
							{% else %}
							<p>{{rendered_value}}</p>
							{% endif %} ;;
						}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F1, ...error});
		});

		// TODO: Expose assembleModels from parser to test extensions here without full parseFiles & dummy project test case
		// it('should not error for a view with extension:required', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			sql_table_name: foo ;;
		// 			extension: required
		// 			dimension: baz { sql: \${abc.xyz} ;; }
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage(summary(1, 0, 0));
		// 	expect(result).not.toContainMessage(error);
		// });

		// it('should error for a view extending from an extension:required view', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			sql_table_name: foo ;;
		// 			extension: required
		// 			dimension: baz { sql: \${abc.xyz} ;; }
		// 		}
		// 		view: baz {
		// 			extends: [foo]
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage(summary(2, 0, 1));
		// 	expect(result).toContainMessage({...F1, ...error});
		// });
	});
});
