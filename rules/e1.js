/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
// const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'E1',
		match: `$.model.*.explore.*.join.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	let join = match;

	let sql = join.sql || join.sql_on || '';
	let sqlWithLkmlRemoved = sql.replace(/\${[\s\S]*?}|{{[\s\S]*?}}|{%\s*if[\s\S]*?endif\s*%}|{%[\s\S]*?%}/g, '');
	let references = (sqlWithLkmlRemoved.match(/[a-zA-Z0-9._]+\.[a-zA-Z0-9 ._]+/g) || [])
		.filter((ref) => !( // Two-part references to allow
			ref.match(/^safe\./i) // BigQuery: https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators#safe-prefix
		));
	return references.map((ref) =>`${ref} should be referenced using the substitution operator`);
}
