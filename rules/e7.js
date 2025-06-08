/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'E7',
		match: `$.model.*.explore.*`,
		description: 'Explore labels should not be too long.',
		ruleFn,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

function ruleFn(match, path, project, options={}) {
	const explore = match;

	// refinements appear as an array, but we'll ignore and only look at the final explore
	if (Array.isArray(explore)) {
		return true;
	}

	const label = explore.label
		? {source: 'label', text: explore.label}
		: {source: 'name', text: explore.$name};
	const length = label.text.length;
	const maxLength = options.maxLength || 25;
	if (length > maxLength) {
		return `Explore ${label.source}'s length (${length}) exceeds allowed length (${maxLength})`;
	}
	return true;
}
