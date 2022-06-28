/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F4';
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
		let views = Object.values(file.view || {});
		for (let view of views) {
			let fields = []
				.concat(Object.values(view.dimension || {}))
				.concat(Object.values(view.measure || {}))
				.concat(Object.values(view.filter || {}))
				.concat(Object.values(view.parameter || {}));
			for (let field of fields) {
				matchCt++;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if (exempt) {
					exemptionCt++; continue;
				}

				let location = `view:${view.$name}/${field.$type}:${field.$name}`;
				let path = `/projects/${project.name}/files/${file.$file_path}#${location}`;
				if (!field.hidden && !field.description) {
					errorCt++;
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `${location} is missing a description`,
						hint: 'Either apply a description or hide it',
					});
				}
			}
		}
	}
	messages.push({
		rule, level: 'info',
		description: `Evaluated ${matchCt} matches, with ${exemptionCt} exempt and ${errorCt} erroring`,
	});
	return {
		messages,
	};
};
