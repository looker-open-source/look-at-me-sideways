/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'T1',
		match: `$.model.*.view.*.derived_table`,
		description: 'Triggered PDTs should use datagroups (and not sql_trigger_value).',
		expr_rule: `($all
			(=== ::match:sql_trigger_value undefined)
			(=== ::match:interval_trigger undefined)
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
