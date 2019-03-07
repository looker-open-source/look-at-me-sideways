/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F4';
	let exempt;
	if (exempt = getExemption(project.file && project.file.manifest, rule)) {
		return [{
			rule, exempt, level: 'info', location: 'project',
			path: `/projects/${project.name}/files/manifest.lkml`,
		}];
	}
	let ok = true;
	let files = project.files || [];
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let fields = []
				.concat(view.dimensions||[])
				.concat(view.measures||[])
				.concat(view.filters||[])
				.concat(view.parameters||[]);
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if ( !field.hidden && !field.description) {
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `${location} is missing a description`,
						hint: 'Either apply a description or hide it',
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
