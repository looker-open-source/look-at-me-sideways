/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'F3',
		match: `$.model.*.view.*.measure[?(@.type==="count")]`,
		description: "All `type:count` measures should specify a filter",
		expr_rule: `
			($if (=== ::match:filters undefined)
				($concat "Type:count measure \`" ::match:$name "\` does not have a filter applied")
				true
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
