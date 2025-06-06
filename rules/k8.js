/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'K8',
		match: `$.model.*.view.*.dimension[?(@.primary_key===true)]`,
		description: 'The `primary_key` dimension must use or be the Primary Key Dimension(s).',
		ruleFn,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

const simplePkRegex = /^(1pk|pk1?)_[a-z0-9A-Z_]+$/;
const pkReferencesRegex = /\$\{\s*([0-9]+pk|pk[0-9]*)_[a-z0-9A-Z_]+\s*}/g;
const unique = (x, i, arr) => arr.indexOf(x)===i;
const min = (a, b) => a<b?a:b;
const max = (a, b) => a>b?a:b;

function ruleFn(match) {
	const dim = match;
	if (dim.$name.match(simplePkRegex)) {
		return true;
	}
	const sql = dim.sql || '${TABLE}.'+dim.$name;
	const pksMatched = sql.match(pkReferencesRegex);
	if (!pksMatched) {
		return `primary_key dimension does not reference any PK-named fields`;
	}
	const pksReferenced = pksMatched
		.map((match)=>match.match(/[a-z0-9A-Z_]+/)[0])
		.filter(unique);
	const pkSizeDeclarations = pksReferenced.map((pk)=>parseInt(pk.match(/\d+/)||'1'));
	const maxDeclaration = pkSizeDeclarations.reduce(max);
	const minDeclaration = pkSizeDeclarations.reduce(min);
	if (minDeclaration !== maxDeclaration) {
		return `Composite primary_key's PK-named field references specify different column counts (${minDeclaration}, ${maxDeclaration})`;
	}
	if (pksReferenced.length !== maxDeclaration) {
		return `The number of PKs used (${pksReferenced.length}) does not match the declared number of PK columns (${maxDeclaration})`;
	}
	return true;
}
