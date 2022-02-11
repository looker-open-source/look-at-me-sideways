/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F1';
	let exempt;
	if (exempt = getExemption(project.manifest, rule)) {
		messages.push({
			rule, exempt, level: 'info', location: 'project',
			path: `/projects/${project.name}/files/manifest.lkml`,
			description: 'Project-level rule exemption',
		});
		return {messages};
	}
	let matchCt = 0;
	let exemptionCt = 0;
	let errorCt = 0;
	let files = project.files || [];
	for (let file of files) {
		let path = `/projects/${project.name}/files/${file.$file_path}`;
		let views = Object.values(file.view || {});
		for (let view of views) {
			let location = `view:${view.$name}`;
			if (!view.sql_table_name && !view.derived_table && !view.extends) {
				messages.push({
					location, path, rule:'F1', level: 'verbose',
					description: `Field-only view ${view.$name} is not subject to no-cross view references rule`,
				});
				continue;
			}
			let fields = []
				.concat(Object.values(view.dimension || {}))
				.concat(Object.values(view.measure || {}))
				.concat(Object.values(view.filter || {}));
			for (let field of fields) {
				matchCt++;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if (exempt) {
					exemptionCt++; continue;
				}
				let location = `view:${view.$name}/${field.$type}:${field.$name}`;
				[field.sql,
					field.html,
					field.label_from_parameter && '{{' + field.label_from_parameter + '}}',
					...[].concat(field.link||[]).map((link) => link.url),
					...[].concat(field.link||[]).map((link) => link.icon_url),
					// measure.*.filter has been deprecated and replaced by measure.*.filters, with a different syntax
					// I am keeping this check around for historical consistency, but there should eventually be a rule
					// to guard against the old syntax at all, and this could be updated accordingly.
					...[].concat(field.filter||[]).map((filter) => '{{' + filter.field + '}}'),
				].forEach((value) => {
					if (!value || !value.replace) {
						return;
					}
					let match = value
						.replace(/\b\d+\.\d+\b/g, '') // Remove decimals
						.match(/(\$\{|\{\{|\{%)\s*(([^.{}]+)(\.[^.{}]+)+)\s*(%\}|\})/);
					let parts = ((match || [])[2] || '').split('.').filter(Boolean);
					if (!parts.length) {
						return;
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
						'_label',
					].includes(parts[parts.length - 1])
					) {
						parts.pop();
					}
					if (parts.length > 1) {
						errorCt++;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `${field.$name} references another view, ${parts[0]},  via ${match[0]}`,
						});
					}
				});
			}
		}
	}
	messages.push({
		rule, level: 'info',
		description: `Evaluated ${matchCt} fields, with ${exemptionCt} exempt and ${errorCt} erroring`,
	});
	return {
		messages,
	};
};
