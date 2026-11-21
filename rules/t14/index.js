/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

function isPersistedDerivedTable(dt) {
	if (!dt || typeof dt !== 'object') {
		return false;
	}
	return Boolean(
		dt.persist_for ||
		dt.sql_trigger_value ||
		dt.datagroup_trigger ||
		dt.interval_trigger ||
		dt.create_process ||
		dt.sql_create ||
		dt.materialized_view,
	);
}

function getDerivedTableSqlStrings(dt) {
	const sqls = [];
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
	return sqls;
}

function hasDynamicSql(sql) {
	const stripped = sql
		.replace(/--[^\n]*(\n|$)/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/\{\{\s*_model\._name\s*\}\}/g, '');
	return /\{%|\{\{/.test(stripped);
}

module.exports = function(project) {
	const rule = {
		$name: 'T14',
		description: 'Persisted derived tables should not use Liquid or dynamic SQL (except {{_model._name}}).',
		match: '$.model.*.view.*.derived_table',
		ruleFn: (dt, path) => {
			if (!isPersistedDerivedTable(dt)) {
				return true;
			}
			const sqls = getDerivedTableSqlStrings(dt);
			if (sqls.some(hasDynamicSql)) {
				return `Persisted derived table in view "${path[3]}" should not use Liquid or dynamic SQL (except {{_model._name}}).`;
			}
			return true;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
