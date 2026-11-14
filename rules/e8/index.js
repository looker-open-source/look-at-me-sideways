/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');
const checkNullFilters = require('../rules-lib/check-null-filter.js');

module.exports = function(project) {
	const rule = {
		$name: 'E8',
		match: `$.model.*.explore.*`,
		description: 'Explore always_filter and conditionally_filter should use "-NULL" for string fields and "NOT NULL" for numeric fields.',
		ruleFn: (explore, path, proj) => {
			if (!explore) {
				return true;
			}
			const model = proj && proj.model && proj.model[path[1]];
			const errors = [];
			if (explore.always_filter && explore.always_filter.filters) {
				errors.push(...checkNullFilters(explore.always_filter.filters, {model, explore}));
			}
			if (explore.conditionally_filter && explore.conditionally_filter.filters) {
				errors.push(...checkNullFilters(explore.conditionally_filter.filters, {model, explore}));
			}
			return errors.length ? errors : true;
		},
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});
	return {messages, rule};
};
