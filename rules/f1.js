/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F1';
	let exempt;
	if (exempt = getExemption(project.file && project.file.manifest, rule)) {
		messages.push({
			rule, exempt, level: 'info', location: 'project',
			path: `/projects/${project.name}/files/manifest.lkml`,
			description: 'Project-level rule exemption',
		});
		return {messages};
	}
	let ok = true;
	let files = project.files || [];
	for (let file of files) {
		let views = Object.values(file.view || {});
		for (let view of views) {
			if (!view.sql_table_name && !view.derived_table && !view.extends) {
				continue;
			}
			let fields = []
				.concat(Object.values(view.dimension||{}))
				.concat(Object.values(view.measure||{}))
				.concat(Object.values(view.filter||{}));
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._dimension||field._measure||field._filter}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				// TODO: Doublecheck the below matches the actual LookML parameters... I wrote the below without internet connectivity -FB
				[field.sql,
					field.html,
					field.label_from_parameter,
					field.link && Object.values(field.link).map((o)=>o.url).join(''),
					field.link && Object.values(field.link).map((o)=>o.url).join(''),
					field.filter && Object.values(field.filter).map((o)=>'{{'+o.field+'}}').join(''),
				].forEach((value) => {
					if (!value || !value.replace) {
						return;
					}
					let match = value
						.replace(/\b\d+\.\d+\b/g, '') // Remove dedimals
						.match(/(^|\$\{|\{\{|\{%)\s*(([^.{}]+)(\.[^.{}]+)+)\s*($|%\}|\})/);
					let parts = ((match||[])[2]||'').split('.').filter(Boolean);
					if (!parts.length) {
						return;
					}
					// Don't treat references to TABLE or to own default alias as cross-view
					if (parts[0] === 'TABLE' || parts[0] === view._view ) {
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
					].includes(parts[parts.length-1])
					) {
						parts.pop();
					}
					if ( parts.length > 1 ) {
						ok = false;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `${field._dimension||field._measure} references another view, ${parts[0]},  via ${match[0]}`,
						});
					}
				});
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No cross-view references found`,
		});
	}
	return {
		messages,
	};
};
