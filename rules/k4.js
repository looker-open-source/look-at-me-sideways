/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'K4',
		match: `$.model.*.view.*`,
		description: "Primary Key Dimensions should be hidden",
		expr_rule: `
			($let view ::match)
			($let dimensions ($object-values ::view:dimension))
			($let pkDimensions ($filter dimensions (-> (dim) ($match "^([0-9]+pk|pk[0-9]*)_([a-z0-9A-Z_]+)$" ::dim:$name ))))
			($let badDimensions ($filter pkDimensions (-> (dim) ($not ::dim:hidden))))
			($map badDimensions (-> (dim) ($concat "PK dimension " ::dim:$name " is not hidden")))
		`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
