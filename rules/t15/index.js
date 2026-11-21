/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const UNION_SCAN_REGEX = new RegExp(
	[
		'\'[^\\\\\']*(\\\\.[^\\\\\']*)*\'',
		'"[^\\\\"]*(\\\\.[^\\\\"]*)*"',
		'`[^\\\\`]*(\\\\.[^\\\\`]*)*`',
		'--[^\\n]*',
		'/\\*[\\s\\S]*?\\*/',
		'(\\bUNION\\b)(?:\\s*(/\\*[\\s\\S]*?\\*/|--[^\\n]*|\\b(?:ALL|DISTINCT)\\b))?',
	].join('|'),
	'gi',
);

function hasUnqualifiedUnion(sql) {
	if (typeof sql !== 'string' || !sql) {
		return false;
	}
	UNION_SCAN_REGEX.lastIndex = 0;
	let match;
	while ((match = UNION_SCAN_REGEX.exec(sql)) !== null) {
		// match[1] is the \bUNION\b capture group when not inside a string or comment
		// Note: string literal groups have 3 inner capture groups, so \bUNION\b is at index 4
		if (match[4] && !match[5]) {
			return true;
		}
	}
	return false;
}

function getViewSqlStrings(view) {
	const sqls = [];
	if (typeof view.sql_table_name === 'string') {
		sqls.push(view.sql_table_name);
	}
	const dt = view.derived_table;
	if (dt && typeof dt === 'object') {
		if (typeof dt.sql === 'string') {
			sqls.push(dt.sql);
		}
		if (typeof dt.sql_create === 'string') {
			sqls.push(dt.sql_create);
		}
		if (dt.create_process && dt.create_process.sql_step) {
			const steps = Array.isArray(dt.create_process.sql_step)
				? dt.create_process.sql_step
				: [dt.create_process.sql_step];
			for (const step of steps) {
				if (step && typeof step.sql === 'string') {
					sqls.push(step.sql);
				}
			}
		}
	}
	return sqls;
}

module.exports = function(project) {
	const rule = {
		$name: 'T15',
		description: 'UNION should not be used where UNION ALL is needed or sufficient; make intentional plain UNION explicit (e.g., UNION /*DISTINCT*/).',
		match: '$.model.*.view.*',
		ruleFn: (view, path) => {
			if (!view) {
				return true;
			}
			const sqls = getViewSqlStrings(view);
			if (sqls.some(hasUnqualifiedUnion)) {
				return `View "${view.$name || path[3]}" uses plain UNION. Use UNION ALL, UNION DISTINCT, or an accompanying comment such as UNION /*DISTINCT*/ if deduplication is intentional.`;
			}
			return true;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
