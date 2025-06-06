/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'F2',
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter].*`,
		description: 'Fields should not declare a view-label.',
		expr_rule: `
			($if (!== ::match:view_label undefined)
				($concat ::match:$name " contains a field-level view_label \`" ::match:view_label "\`")
				true
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
