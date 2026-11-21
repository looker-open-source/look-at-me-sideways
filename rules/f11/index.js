/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');
const checkNullFilters = require('../rules-lib/check-null-filter.js');

module.exports = function(project) {
	const rule = {
		$name: 'F11',
		match: `$.model.*.view.*.measure.*`,
		description: 'Filtered measures should use "-NULL" for string fields and "NOT NULL" for numeric fields.',
		ruleFn: (measure, path, proj) => {
			if (!measure || !measure.filters) {
				return true;
			}
			const model = proj && proj.model && proj.model[path[1]];
			const currentViewName = path[3];
			const errors = checkNullFilters(measure.filters, {model, currentViewName});
			return errors.length ? errors : true;
		},
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});
	return {messages, rule};
};
