/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'F3',
		match: `$.model.*.view.*.measure[?(@.type==="count")]`,
		expr_rule: `
			($if (=== ::match:filters undefined)
				($concat "Type:count measure \`" ::match:$name "\` does not have a filter applied")
				true
			)`,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};
