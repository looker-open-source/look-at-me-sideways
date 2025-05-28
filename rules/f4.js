/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'F4',
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter][?(@.hidden!==true)]`,
		description: "Non-hidden fields should have descriptions.",
		expr_rule: `
			($if ($boolean ::match:description)
				true
				($concat "Non-hidden field \`" ::match:$name "\` does not have a description")
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
