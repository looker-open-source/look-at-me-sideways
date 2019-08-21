/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F3';
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
		let views = Object.values(file.view||{});
		for (let view of views) {
			let fields = Object.values(view.measure||{});
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if (field.type === 'count' && field.filters === undefined) {
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `Type:count measure at ${location} does not have a filter applied`,
					});
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No type:count measures without a filter found`,
		});
	}
	return {
		messages,
	};
};
