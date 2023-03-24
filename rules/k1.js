/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const pkNamingConvention = require('./rules-lib/pk-naming-convention.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'K1',
		match: `$.model.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	let view = match;

	const unique = (x, i, arr) => arr.indexOf(x) === i;

	/* Skip field-only views */
	if (!view.derived_table && !view.sql_table_name) {
		return {
			level: 'verbose',
			description: `Field-only view ${view.$name} is not subject to Primary Key Dimension rule K1`,
		};
	}

	let pkDimensions = (Object.values(view.dimension || {})).filter(pkNamingConvention);

	if (!pkDimensions.length) {
		return `View ${view.$name} has no dimensions that follow the PK naming convetion`;
	}

	let declaredNs = pkDimensions
		.map(pkNamingConvention)
		.map((match) => match[1].replace('pk', ''))
		.map((n) => (n===''?'1':n))
		.filter(unique);
	if (declaredNs.length > 1) {
		return `Different PK dimensions in ${view.$name} declare different column counts: ${declaredNs.join(', ')}`;
	}

	let n = parseInt(declaredNs[0]);
	if (n != pkDimensions.length && n !== 0) {
		return `View ${view.$name} has ${pkDimensions.length} PK dimension(s) but their names declare ${declaredNs[0]} columns`;
	}

	return true;
}
