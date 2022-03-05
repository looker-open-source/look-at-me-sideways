const {parse} = require('../lib/custom-rule/custom-rule-parser.js');

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
});
