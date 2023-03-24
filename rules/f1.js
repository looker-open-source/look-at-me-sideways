/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'F1',
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter].*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	let view = deepGet(project, path.slice(0, 4));
	let field = match;

	if (!view.sql_table_name && !view.derived_table) {
		return {
			level: 'verbose',
			description: `Field-only view ${view.$name} is not subject to no-cross view references rule`,
		};
	}

	let messages = [];
	let referenceContainers = [
		field.sql,
		field.html,
		field.label_from_parameter && '{{' + field.label_from_parameter + '}}',
		...[].concat(field.link||[]).map((link) => link.url),
		...[].concat(field.link||[]).map((link) => link.icon_url),
		// measure.*.filter has been deprecated and replaced by measure.*.filters, with a different syntax
		// I am keeping this check around for historical consistency, but there should eventually be a rule
		// to guard against the old syntax at all, and this could be updated accordingly.
		...[].concat(field.filter||[]).map((filter) => '{{' + filter.field + '}}'),
	];
	for (let referenceContainer of referenceContainers) {
		if (!referenceContainer || !referenceContainer.replace) {
			continue;
		}
		// TODO: Currently only checking the first reference in each block/container, should loop through them all
		let regexMatch = referenceContainer
			.replace(/\b\d+\.\d+\b/g, '') // Remove decimals
			.match(/(\$\{|\{\{|\{%)\s*(([^.{}]+)(\.[^.{}]+)+)\s*(%\}|\})/);
		let parts = ((regexMatch || [])[2] || '').split('.').map((p)=>p.trim()).filter(Boolean);
		if (!parts.length) {
			continue;
		}
		// Don't treat references to TABLE or to own default alias as cross-view
		if (parts[0] === 'TABLE' || parts[0] === view.$name) {
			parts.shift();
		}
		// Don't treat references to special properties as cross-view
		// Note: view._in_query,_is_filtered,_is_selected should not be allowed in fields
		if ([
			'SQL_TABLE_NAME',
			'_sql',
			'_value',
			'_name',
			'_filters',
			'_parameter_value',
			'_rendered_value',
			'_label',
		].includes(parts[parts.length - 1])
		) {
			parts.pop();
		}
		if (parts.length > 1) {
			messages.push({
				level: 'error',
				description: `${field.$name} references another view, ${parts[0]},  via ${parts.join('.')}`,
			});
		}
	}
	return messages;
}
