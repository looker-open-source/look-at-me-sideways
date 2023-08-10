/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'E6',
		match: `$.model.*.explore.*.join[?(@.foreign_key)]`,
		description: 'Foreign-key based joins may not be *-to-many',
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	const join = match;
	const describeRelationship = join.relationship || 'implicitly many_to_one';
	const simplePkRegex = /^(1pk|pk1?)_([a-z0-9A-Z_]+)$/;
	if (join.foreign_key.match(simplePkRegex)) {
		// Foreign key is also the base view's primary key. The relationship must be one_to_one
		if (join.relationship === 'one_to_one') {
			return true;
		}
		return `A foreign_key join from a primary key should be one_to_one, but ${join.$name} is ${describeRelationship}`;
	} else {
		if (join.relationship === 'many_to_one') {
			return true;
		}
		if (join.relationship === undefined) {
			return true;
		}
		return `A foreign_key join should be many_to_one, but ${join.$name} is ${describeRelationship}`;
	}
}
