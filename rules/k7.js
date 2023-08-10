/* Copyright (c) Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'K7',
		match: `$.model.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

const zeroPkRegex = /^(0pk|pk0)_[a-z0-9A-Z_]+$/;

function ruleFn(match) {
	const view = match;

	if (!view.derived_table && !view.sql_table_name) {
		return {
			level: 'verbose',
			description: `Field-only view ${view.$name} is not subject to Primary Key Dimension rule K7`,
		};
	}

	const dimensions = Object.values(view.dimension);
	const pkDims = dimensions.filter((d)=>d.primary_key);
	if (pkDims.length === 0) {
		if (dimensions.some((d)=>d.$name.match(zeroPkRegex))) {
			return true;
		}
		return 'No primary_key:yes dimensions provided';
	}
	if (pkDims.length > 1) {
		const pkDimNames = pkDims.map((d)=>d.$name);
		return `Too many (>1) primary_key:yes dimensions provided: ${pkDimNames}`;
	}
	return true;
}
