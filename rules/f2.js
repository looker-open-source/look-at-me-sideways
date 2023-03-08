/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: "F2",
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter].*`,
		matchAbstract: false,
		expr_rule: `
			($if (!== ::match:view_label undefined)
				($concat ::match:$name " contains a field-level view_label \`" ::match:view_label "\`")
				true
			)`
	}
	let messages = checkCustomRule(ruleDef, project, {ruleSource:'internal',console})

	return {messages} 
}

function oldRuleFn(
	project,
) {
	let messages = [];
	let rule = 'F2';
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
				.concat(Object.values(view.dimension||{}))
				.concat(Object.values(view.measure||{}))
				.concat(Object.values(view.filter||{}))
				.concat(Object.values(view.parameter||{}));
			for (let field of fields) {
				matchCt++;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if (exempt) {
					exemptionCt++; continue;
				}

				let location = `view:${view.$name}/${field.$type}:${field.$name}`;
				let path = `/projects/${project.name}/files/${file.$file_path}#${location}`;
				if ( field.view_label !== undefined) {
					errorCt++;
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `${location} contains a field-level view_label "${field.view_label}"`,
						hint: 'If specific fields require different view_labels, consider splitting them out into their own field-only view(s) and applying a `label` there',
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
