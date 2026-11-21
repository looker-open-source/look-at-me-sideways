/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const DEFAULT_TIMEFRAMES = ['raw', 'time', 'date', 'week', 'month', 'quarter', 'year'];

function hasTable(view) {
	if (!view) {
		return false;
	}
	if (view.sql_table_name) {
		return true;
	}
	const dt = view.derived_table;
	if (!dt) {
		return false;
	}
	return Boolean(
		dt.persist_for ||
		dt.sql_trigger_value ||
		dt.datagroup_trigger ||
		dt.interval_trigger ||
		dt.create_process ||
		dt.sql_create,
	);
}

function getBaseViewName(explore) {
	return explore.from || explore.view_name || explore.$name;
}

function isBaseOfNonHiddenExplore(viewName, model) {
	const explores = model.explore || {};
	return Object.values(explores).some((explore) => {
		if (!explore || explore.hidden) {
			return false;
		}
		return getBaseViewName(explore) === viewName;
	});
}

function isRowCountAssert(assertObj) {
	if (!assertObj || typeof assertObj !== 'object') {
		return false;
	}
	const expr = String(assertObj.expression || '');
	return /\bcount\b/i.test(expr) || /\brow/i.test(expr) || /<=?\s*\d+/.test(expr);
}

function hasMaxRowCountDataTest(viewName, model) {
	const tests = model.test || {};
	const explores = model.explore || {};
	return Object.values(tests).some((test) => {
		if (!test || !test.explore_name) {
			return false;
		}
		const explore = explores[test.explore_name];
		if (!explore || getBaseViewName(explore) !== viewName) {
			return false;
		}
		const measures = (test.query && test.query.measures) || [];
		const hasCountMeasure = Array.isArray(measures) && measures.some((m) => /\bcount\b/i.test(String(m)));
		const asserts = Object.values(test.assert || {});
		const hasAssert = asserts.some((a) => isRowCountAssert(a));
		return hasAssert && (hasCountMeasure || asserts.some((a) => /\bcount\b/i.test(String(a && a.expression || ''))));
	});
}

function resolveViewField(view, fieldRef) {
	if (!view || !fieldRef) {
		return null;
	}
	const ref = String(fieldRef).trim();
	const collections = ['dimension', 'filter', 'parameter', 'measure'];
	for (const coll of collections) {
		if (view[coll] && view[coll][ref]) {
			return view[coll][ref];
		}
	}
	const dgs = view.dimension_group || {};
	for (const [dgName, dg] of Object.entries(dgs)) {
		if (!dg) {
			continue;
		}
		if (dgName === ref) {
			return dg;
		}
		const timeframes = Array.isArray(dg.timeframes) && dg.timeframes.length
			? dg.timeframes
			: DEFAULT_TIMEFRAMES;
		for (const tf of timeframes) {
			if (`${dgName}_${tf}` === ref) {
				return dg;
			}
		}
	}
	return null;
}

function getFirstPdtKey(dt) {
	if (!dt || !dt.sql) {
		return null;
	}
	if (Array.isArray(dt.sortkeys) && dt.sortkeys.length > 0) {
		return {type: 'sortkeys', column: dt.sortkeys[0]};
	}
	if (Array.isArray(dt.indexes) && dt.indexes.length > 0) {
		return {type: 'indexes', column: dt.indexes[0]};
	}
	if (Array.isArray(dt.partition_keys) && dt.partition_keys.length > 0) {
		return {type: 'partition_keys', column: dt.partition_keys[0]};
	}
	return null;
}

function fieldSqlReferencesTableColumn(field, column) {
	if (!field || !field.sql || !column) {
		return false;
	}
	const escapedCol = String(column).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`\\$\\{TABLE\\}\\s*\\.\\s*["\`\\[]?${escapedCol}["\`\\]]?\\b`, 'i');
	return pattern.test(String(field.sql));
}

module.exports = function(project) {
	const rule = {
		$name: 'T3',
		description: 'Views backed by a table and exposed as the base of a non-hidden explore should declare a valid required_filter (or assert a small row count via a data test). If the view is a PDT with a sql definition, the required_filter field should reference its first sortkey, index, or partition_key.',
		match: '$.model.*.view.*',
		ruleFn: (view, path, proj) => {
			const modelKey = path[1];
			const model = proj && proj.model && proj.model[modelKey];
			if (!view || !model) {
				return true;
			}
			const viewName = view.$name || path[3];
			if (!hasTable(view) || !isBaseOfNonHiddenExplore(viewName, model)) {
				return true;
			}

			const requiredFilter = view.required_filter;
			if (!requiredFilter) {
				if (hasMaxRowCountDataTest(viewName, model)) {
					return true;
				}
				return [{
					rule: 'T3.1',
					description: `View "${viewName}" is backed by a table and used as the base of a non-hidden explore, so it should declare "#LAMS required_filter: <field_name>" or have a data test asserting a maximum row count.`,
				}];
			}

			const field = resolveViewField(view, requiredFilter);
			if (!field) {
				return [{
					rule: 'T3.2',
					description: `View "${viewName}" declares required_filter "${requiredFilter}", which does not resolve to a field in the view.`,
				}];
			}

			const firstKey = getFirstPdtKey(view.derived_table);
			if (firstKey && !fieldSqlReferencesTableColumn(field, firstKey.column)) {
				return [{
					rule: 'T3.3',
					description: `View "${viewName}" is a PDT with ${firstKey.type} starting with "${firstKey.column}", so required_filter "${requiredFilter}" should reference \${TABLE}.${firstKey.column} in its sql.`,
				}];
			}

			return true;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
