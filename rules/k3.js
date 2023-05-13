/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const pkNamingConvention = require('./rules-lib/pk-naming-convention.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'K3',
		// Unlike most other rules, this is by file, not by model, because it's interested in the lexical declaration, not the assembled model object
		match: `$.file.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	let view = match;

	let dimensions = Object.values(view.dimension || {});
	let pkDimensions = dimensions.filter(pkNamingConvention);
	let n = pkDimensions.length;

	let firstNDimensions = dimensions.slice(0, n);
	let badDimensions = firstNDimensions.filter((dim) => !pkNamingConvention(dim));
	if (badDimensions.length) {
		return `View ${view.$name} contains dimensions declared before PK dimension(s), e.g. ${badDimensions[0].$name}`;
	}

	return true;
}
