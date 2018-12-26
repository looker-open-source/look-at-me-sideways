/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
exports = module.exports = {
	groupBy: function groupBy({
		title = '',
		grouping = [], // Array or comma separated string of column names
		summaries = {count: (total)=>(total||0)+1},
	}={}) {
		// Arguments: string split(,) to array, falsey to empty array
		if (grouping.split) {
			grouping = grouping.split(',').map((substr)=>substr.trim()).filter(Boolean);
		}
		grouping = grouping.map((g) => typeof g == 'function' ? g : (x)=>x[g] );
		const finishGrouping = {};
		grouping.push(()=>finishGrouping);

		return function(accum, datum, d) {
			let root = accum || {key: title, subgroups: {}, summaries: {}};
			let group = root;
			for (let g of grouping) {
				let key = g(datum);
				for (let [s, summary] of Object.entries(summaries)) {
					group.summaries[s] = summary(group.summaries[s], datum);
				}
				if (key===finishGrouping) {
					break;
				}
				group.subgroups[key] = group.subgroups[key] || {key, subgroups: {}, summaries: {}};
				group = group.subgroups[key];
			}
			group.data = (group.data||[]).concat(datum);
			return root;
		};
	},
	format: function format(str) {
		str = (''+(str===undefined?'':str));
		if (str.match(/^_?[a-z][a-z0-9]*_[_a-z0-9]+$/)) {
			return str;
		} // Don't touch lookml snake case like things
		return str
			.replace(/^\s*[a-z]/, (str)=>str.toUpperCase()) // Capitalize first
			.replace(/[a-z][A-Z]/g, (str)=>str[0]+' '+str[1]); // Camelcase to spaces
	},
	ruleName: function(id) {
		return {
			k1: 'Primary keys required',
			k2: 'Primary key naming',
			k3: 'Primary key location',
			k4: 'Primary key hidden',
			k5: 'Distribution dimensions',
			k6: 'Sort dimensions',
			f1: 'No inter-view dependencies',
			f2: 'No view-labeled fields',
			f3: 'Count fields filtered',
			f4: 'Description or hidden',
			f5: 'ID fields hidden',
			f6: 'FK ID fields hidden',
			t1: 'Triggers use datagroups',
			t2: 'Primary keys required',
			t3: 'Primary key naming',
			t4: 'Primary key positioning',
			t5: 'Grouped PK starts...',
			t6: 'Ungrouped PK starts...',
			t7: 'PK continues with window',
			t8: 'PK ends with - - -',
			t9: 'SELECT 1 col allowed',
			e1: 'Substitution operator used',
			e2: 'Primary keys used',
			e3: 'Join on dist/sort keys when possible',
			e4: 'always_filter on sortkey',
			e5: 'Avoid multiplicative fanout',
		}[(''+id).toLowerCase()]
		|| '';
	},
};
