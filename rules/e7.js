/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'E7',
		match: `$.model.*.explore.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project, options={}) {
	const explore = match;
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
