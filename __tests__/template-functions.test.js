/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const {groupBy} = require('../lib/outputters/templating/template-functions.js');

describe('Template Functions', () => {
	describe('groupBy', () => {
		it('should return an object with a count summary if used with no arguments', () => {
			let data = [{}, {}, {}];
			let result = data.reduce(groupBy(), null);
			expect(result).toMatchObject({
				summaries: {count: 3},
			});
		});
		it('should return an object with other summaries if used with reducers in the summaries option', () => {
			let data = [{x: 100}, {x: 10}, {x: 1}];
			let result = data.reduce(groupBy({
				summaries: {
					myCount: (total) => (total||0)+1,
					sum: (total, obj) => (total||0)+obj.x,
					product: (total, obj) => (total||1)*obj.x,
				},
			}), null);
			expect(result).toMatchObject({
				summaries: {
					myCount: 3,
					sum: 111,
					product: 1000,
				},
			});
		});
		it('should return an object with subgroups corresponding to keys or functions in the grouping option', () => {
			let data = [{a: 'foo', x: 100}, {a: 'bar', x: 10}, {a: 'baz', x: 1}, {a: 'baz', x: 0}];
			let result = data.reduce(groupBy({
				grouping: [
					(obj) => obj.a.slice(0, 1),
					'a',
				],
				summaries: {
					myCount: (total) => (total||0)+1,
					sum: (total, obj) => (total||0)+obj.x,
					product: (total, obj) => (total||1)*obj.x,
				},
			}), null);
			expect(result).toMatchObject({
				summaries: {
					myCount: 4, sum: 111, product: 0,
				},
				subgroups: {
					f: {
						key: 'f',
						summaries: {myCount: 1, sum: 100, product: 100},
						subgroups: {
							foo: {
								key: 'foo',
								summaries: {myCount: 1, sum: 100, product: 100},
								data: [{a: 'foo', x: 100}],
							},
						},
					},
					b: {
						key: 'b',
						summaries: {myCount: 3, sum: 11, product: 0},
						subgroups: {
							bar: {
								key: 'bar',
								summaries: {myCount: 1, sum: 10, product: 10},
								data: [{a: 'bar', x: 10}],
							},
							baz: {
								key: 'baz',
								summaries: {myCount: 2, sum: 1, product: 0},
								data: [{a: 'baz', x: 1}, {a: 'baz', x: 0}],
							},
						},
					},
				},
			});
		});
	});
});
