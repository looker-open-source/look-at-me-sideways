/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');
module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E1';
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
	let models = Object.values(project.model || {});
	for (let model of models) {
		let explores = Object.values(model.explore || {});
		for (let explore of explores) {
			let path = `/projects/${project.name}/files/${model.$name}.model.lkml`;
			let joins = Object.values(explore.join || {});
			for (let join of joins) {
				matchCt++;
				let exempt = getExemption(join, rule) || getExemption(explore, rule) || getExemption(model, rule);
				if (exempt) {
					exemptionCt++;
				}

				let location = `model:${model.$name}/explore:${explore.$name}/join:${join.$name}`;
				let sql = join.sql || join.sql_on || '';
				let sqlWithLkmlRemoved = sql.replace(/\${[\s\S]*?}|{{[\s\S]*?}}|{%\s*if[\s\S]*?endif\s*%}|{%[\s\S]*?%}/g, '');
				let references = (sqlWithLkmlRemoved.match(/[a-zA-Z0-9._]+\.[a-zA-Z0-9 ._]+/g) || [])
					.filter((ref) => !( // Two-part references to allow
						ref.match(/^safe\./i) // BigQuery: https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators#safe-prefix
					));
				if (references.length) {
					errorCt++;
					messages.push({
						location, path, rule, exempt, level: 'error',
						description:
							references.slice(0, 3).join(', ')
							+ (references.length > 3 ? '...' : '')
							+ ` should be referenced using the substitution operator`,
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
