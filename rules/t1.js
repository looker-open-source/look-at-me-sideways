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
			rule, level: 'info', location: 'project',
			path: `/projects/${project.name}/files/manifest.lkml`,
			description: `Project-level exemption: ${exempt}`,
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
			if (!view.derived_table) {
				continue;
			}
			matchCt++;
			let exempt = getExemption(view.derived_table, rule) || getExemption(view, rule) || getExemption(file, rule);
			if (exempt) {
				exemptionCt++; continue;
			}

			let location = 'view: ' + view.$name;
			let path = '/projects/' + project.name + '/files/' + file.$file_path + '#view:' + view.$name;
			if (!(view.derived_table.datagroup_trigger || view.derived_table.persist_for)
				&& view.derived_table.sql_trigger_value) {
				errorCt++;
				messages.push({
					location, path, rule, exempt, level: 'error',
					description: `Triggered PDTs should use datagroups.`,
				});
			}
		}
	}

	messages.push({
		rule, level: 'info',
		description: `Evaluated ${matchCt} derived tables, with ${exemptionCt} exempt and ${errorCt} erroring`,
	});

	return {
		messages,
	};
};
