/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'F9',
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter][?(@.hidden!==true)]`,
		description: 'Field labels should not be too long.',
		expr_rule: `
			($let hasLabel ($boolean ::match:label))
			($let source ($if hasLabel "label" "name"))
			($let text ($if hasLabel ::match:label ::match:$name))
			($let length ::text:length)
			($let maxLength (?? ($get? options maxLength) 30))
			($if (> length maxLength)
				($concat "Field " source "'s length (" length ") exceeds allowed length (" maxLength ")")
				true
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
