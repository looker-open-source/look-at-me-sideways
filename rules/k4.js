/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const pkNamingConvention = require('./rules-lib/pk-naming-convention.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: "K4",
		match: `$.model.*.view.*`,
		matchAbstract: false,
		ruleFn
	}
	let messages = checkCustomRule(ruleDef, project, {ruleSource:'internal'})

	return {messages} 
}

function ruleFn(match, path, project){
	let view = match

	let pkDimensions = (Object.values(view.dimension || {})).filter(pkNamingConvention);

	let badDims = pkDimensions.filter((dim) => !dim.hidden);
	return badDims.map(dim =>`PK dimension ${dim.$name} is not hidden`)
}
