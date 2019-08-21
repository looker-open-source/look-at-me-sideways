/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F2';
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
			let fields = []
				.concat(Object.values(view.dimension||{}))
				.concat(Object.values(view.measure||{}))
				.concat(Object.values(view.filter||{}))
				.concat(Object.values(view.parameter||{}));
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if ( field.view_label !== undefined) {
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `${location} contains a field-level view_label "${field.view_label}"`,
						hint: 'If specific fields require different view_labels, consider splitting them out into their own field-only view(s) and applying a `label` there',
					});
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No field-level view-labels found`,
		});
	}
	return {
		messages,
	};
};
