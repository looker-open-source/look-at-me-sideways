/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
// const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'E2.1',
		match: `$.model.*.explore.*.join[?(@.foreign_key)]`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	const join = match;
	const pkRegex = /^([0-9]+pk|pk[0-9]*)_([a-z0-9A-Z_]+)$/;
	if(join.relationship === "one_to_many" || join.relationship === "many_to_many"){
		return true
	}
	const pkRegexMatch = join.foreign_key.match(pkRegex)
	if(!pkRegexMatch){
		return `${join.$name} is a *-to-one join that does not join on a PK-named dimension` 
	}
	const declaredKeySize = pkRegexMatch[1].replace("pk","") || "1"
	if(declaredKeySize !== "1"){
		return `${join.$name} is a *-to-one join that uses a single field as a foreign_key whose declared key size is ${declaredKeySize} keys`
	}
	return true
}
