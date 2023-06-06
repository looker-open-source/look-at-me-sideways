/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'T1',
		match: `$.model.*.view.*.derived_table`,
		description: 'PDTs should not use legacy trigger mechanisms (use datagroups instead)',
		expr_rule: `($all
			(=== ::match:sql_trigger_value undefined)
			(=== ::match:interval_trigger undefined)
			)`,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};
