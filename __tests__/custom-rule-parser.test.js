const {parse} = require('../lib/custom-rule/custom-rule-parser.js');
const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const {parse: parseLookml} = require('lookml-parser');

describe('Custom Rule Parser', () => {
	it('Equality rule', () => {
		let rule = parse(`( -> (match) 
			(=== ::match:foo "x")
		)`);
		expect(rule({foo: 'x'})).toEqual(true);
		expect(rule({foo: 'y'})).toEqual(false);
	});
	it('And rules', () => {
		let rule = parse(`( -> (match) 
			($all
				(=== ::match:a 1)
				(=== ::match:b 2)
			)	
		)`);
		expect(rule({a: 1})).toEqual(false);
		expect(rule({b: 2})).toEqual(false);
		expect(rule({a: 1, b: 2})).toEqual(true);
	});
	it('Pattern rules', () => {
		let rule = parse(`( -> (match) 
			($match
				"(ab)+"
				::match:str
			)	
		)`);
		expect(rule({str: 'xxxxx'})).toBeFalsy();
		expect(rule({str: 'xxxababxxx'})).toBeTruthy();
	});
	it('Sequential logic', () => {
		let rule = parse(`( -> (match) ($last
			($__let myvar (+ ::match:a ::match:b) )
			(=== myvar 3)
		))`);
		expect(rule({a: 1, b: 1})).toEqual(false);
		expect(rule({a: 2, b: 2})).toEqual(false);
		expect(rule({a: 1, b: 2})).toEqual(true);
	});
	// FYI, below tests are addressed by https://github.com/shellyln/liyad/issues/1
	it('Prototype unassignable 1', () => {
		let rule = parse(`( -> (match) 
			(::match:constructor:prototype:foo= 1)
		)`);
		expect(() => rule({})).toThrow();
		expect(({}).foo).toBeUndefined();
	});
	it('Prototype unassignable 2', () => {
		let rule = parse(`( -> (match) 
			(::match:constructor@assign ::match:constructor:prototype (# ("bar" 2)) )
		)`);
		expect(() => rule({})).toThrow();
		expect(({}).bar).toBeUndefined();
	});

	it('Can\'t Function.call(untrusted code)', () => {
		let rule = parse(`( -> (match) 
			((::match:toString:constructor@call null "return this" ) ())
		)`);
		expect(() => rule({})).toThrow();
	});

	it('Object.keys', () => {
		let rule = parse(`( -> (match) ($last
			($join ($concat 
				($object-keys ::match)
			) "" )
		))`);
		expect(rule({a: 1, b: 2, c: 3})).toEqual('abc');
	});

	it('Object.entries/fromEntries', () => {
		let rule = parse(`( -> (match) ($last
			($object-from-entries ($object-entries ::match))
		))`);
		expect(JSON.stringify(rule({a: 1, b: 2, c: 3}))).toEqual('{"a":1,"b":2,"c":3}');
		// ^ This is implementation dependent, but good enough for now
	});

	it('Nullish coalescing (??)', () => {
		let rule = parse(`( -> (match) (?? ::match:a "fallback"))`);
		expect(rule({a: undefined})).toEqual('fallback');
		expect(rule({a: null})).toEqual('fallback');
		expect(rule({a: 'ok'})).toEqual('ok');
		expect(rule({a: false})).toEqual(false);
		expect(rule({a: 0})).toEqual(0);
		expect(rule({a: ''})).toEqual('');
	});

	it('Optional chaining ($get?)', () => {
		let rule = parse(`( -> (match options) ($get? options nested maxLength))`);
		expect(rule({}, undefined)).toBeUndefined();
		expect(rule({}, null)).toBeUndefined();
		expect(rule({}, {})).toBeUndefined();
		expect(rule({}, {nested: {maxLength: 42}})).toEqual(42);

		let unsafeRule = parse(`( -> (match) ($get? match constructor))`);
		expect(() => unsafeRule({})).toThrow();
	});

	it('Dynamic property lookup ($get-in), $is-array, $includes, $flatten, $set-prop', () => {
		let rule = parse(`( -> (obj key arr) ($last
			($set-prop obj "added" ($flatten arr))
			($list ($is-array arr) ($includes ($get-in obj key) 2) ($get-in obj "added" 2))
		))`);
		expect(rule({items: [1, 2]}, 'items', [[1], [2, 3]])).toEqual([true, true, 3]);
		expect(() => parse(`( -> (obj) ($set-prop obj "constructor" 1))`)({})).toThrow();
	});
});

describe('before_all in checkCustomRule', () => {
	const project = parseLookml(`model: m { view: v {
		dimension: a { label: "Dup" }
		dimension: b { label: "Dup" }
		dimension: c { label: "Unique" }
	} }`);

	it('supports expr_init + match + expr_reduce', () => {
		const messages = checkCustomRule({
			$name: 'DUP_LABEL',
			before_all: {
				counts: {
					expr_init: `(# )`,
					match: `$.model.*.view.*.dimension.*`,
					expr_reduce: `
						($let lbl ($get? match "label"))
						($set-prop acc lbl (+ (?? ($get-in acc lbl) 0) 1))
					`,
				},
			},
			match: `$.model.*.view.*.dimension.*`,
			expr_rule: `
				($let lbl ($get? match "label"))
				($if (> (?? ($get-in before_all "counts" lbl) 0) 1)
					($concat "Duplicate label: " lbl)
					true
				)
			`,
		}, project);
		const errors = messages.filter((m) => m.level === 'error');
		expect(errors).toHaveLength(2);
		expect(errors.map((m) => m.location)).toEqual([
			'model:m/view:v/dimension:a',
			'model:m/view:v/dimension:b',
		]);
	});

	it('supports expr_init alone without a reducer', () => {
		const messages = checkCustomRule({
			$name: 'INIT_ONLY',
			before_all: {
				model_count: {
					expr_init: `($get? ($object-keys ($get? project "model")) "length")`,
				},
			},
			match: `$.model.*.view.*.dimension.*`,
			expr_rule: `(=== ($get? before_all "model_count") 1)`,
		}, project);
		expect(messages.filter((m) => m.level === 'error')).toHaveLength(0);
	});

	it('supports JS initFn and reduceFn', () => {
		const messages = checkCustomRule({
			$name: 'JS_BEFORE_ALL',
			before_all: {
				dim_names: {
					initFn: () => [],
					match: `$.model.*.view.*.dimension.*`,
					reduceFn: (acc, m) => [...acc, m.$name],
				},
			},
			match: `$.model.*.view.*.dimension.*`,
			ruleFn: (dim, _path, _proj, _opts, beforeAll) => beforeAll.dim_names.includes(dim.$name),
		}, project);
		expect(messages.filter((m) => m.level === 'error')).toHaveLength(0);
	});

	it('errors when expr_reduce is provided without match', () => {
		const messages = checkCustomRule({
			$name: 'MISSING_MATCH',
			before_all: {
				bad: {
					expr_init: `(# )`,
					expr_reduce: `acc`,
				},
			},
			match: `$.model.*.view.*.dimension.*`,
			expr_rule: `true`,
		}, project);
		const errors = messages.filter((m) => m.level === 'error');
		expect(errors).toHaveLength(1);
		expect(errors[0].description).toMatch(/Missing `match` in before_all:bad/);
	});
});
