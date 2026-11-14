/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const isHidden = require('../lib/is-hidden.js');
const {parse} = require('lookml-parser');

describe('isHidden', () => {
	it('should check hidden on explores and fields', () => {
		const project = parse(`
			model: m {
				explore: visible_exp {}
				explore: hidden_exp { hidden: yes }
				view: v {
					dimension: d1 {}
					dimension: d2 { hidden: yes }
				}
			}
		`);
		expect(isHidden(['model', 'm', 'explore', 'visible_exp'], project)).toBe(false);
		expect(isHidden(['model', 'm', 'explore', 'hidden_exp'], project)).toBe(true);
		expect(isHidden(['model', 'm', 'view', 'v', 'dimension', 'd1'], project)).toBe(false);
		expect(isHidden(['model', 'm', 'view', 'v', 'dimension', 'd2'], project)).toBe(true);
	});

	it('should respect view fields_hidden_by_default and explicit hidden: no override', () => {
		const project = parse(`
			model: m {
				view: v {
					fields_hidden_by_default: yes
					dimension: d_default_hidden {}
					dimension: d_explicit_visible { hidden: no }
					measure: m_default_hidden { type: count }
				}
			}
		`);
		expect(isHidden(['model', 'm', 'view', 'v', 'dimension', 'd_default_hidden'], project)).toBe(true);
		expect(isHidden(['model', 'm', 'view', 'v', 'dimension', 'd_explicit_visible'], project)).toBe(false);
		expect(isHidden(['model', 'm', 'view', 'v', 'measure', 'm_default_hidden'], project)).toBe(true);
	});
});
