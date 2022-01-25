/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'T1';
	let exempt;
	if (exempt = getExemption(project.manifest, rule)) {
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
			let location = 'view: ' + view.$name;
			let path = '/projects/' + project.name + '/files/' + file.$file_path + '#view:' + view.$name;
			if (!view.derived_table) {
				continue;
			}
			if (!(view.derived_table.datagroup_trigger || view.derived_table.persist_for)
				&& view.derived_table.sql_trigger_value) {
				let exempt = getExemption(view.derived_table, rule) || getExemption(view, rule) || getExemption(file, rule);
				ok = false;
				messages.push({
					location, path, rule, exempt, level: 'error',
					description: `Triggered PDTs should use datagroups.`,
				});
			}
		}
	}

	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No outdated derived table persistence constructs found.`,
		});
	}

	return {
		messages,
	};
};
