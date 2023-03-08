/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];

	if (getExemption(project.manifest, 'T2')) {
		messages.push({
			rule: 'T2', level: 'info', location: 'project',
			path: `/projects/${project.name}/files/manifest.lkml`,
			description: `T2 covers all of T3-10. Project-level exemption: ${getExemption(project.manifest, 'T2')}`,
		});
		return {messages};
	}

	let ruleIds = ['K1', 'K2', 'K3', 'K4'];
	let rules = {};
	let allExempted = true;
	for (let rule of ruleIds) {
		rules[rule] = {
			globallyExempt: getExemption(project.manifest, rule),
			exemptions: 0,
			errors: 0,
		};
		if (rules[rule].globallyExempt) {
			messages.push({
				rule, level: 'info', location: 'project',
				exempt: rules[rule].globallyExempt,
				path: `/projects/${project.name}/files/manifest.lkml`,
				description: `Project-level exemption: ${rules[rule].globallyExempt}`,
			});
		} else {
			allExempted = false;
		}
	}
	if (allExempted) {
		return {messages};
	}

	const pkNamingConvention = (d) => d.$name.match(/^([0-9]+pk|pk[0-9]*)_([a-z0-9A-Z_]+)$/);
	const unique = (x, i, arr) => arr.indexOf(x) === i;
	let files = project.files || [];

	let matchCt = 0;
	for (let file of files) {
		let rule;
		let views = Object.values(file.view || {});
		for (let view of views) {
			let location = 'view: ' + view.$name;
			let path = '/projects/' + project.name + '/files/' + file.$file_path + '#view:' + view.$name;

			/* Skip field-only views */
			if (!view.derived_table && !view.sql_table_name || view.extends) {
				messages.push({
					location, path, rule: 'K1', level: 'verbose',
					description: `Field-only view ${view.$name} is not subject to Primary Key Dimension rules K1-K4`,
				});
				continue;
			}

			let exempt = (ruleId) =>
				getExemption(project.manifest, ruleId)
				|| getExemption(file, ruleId)
				|| getExemption(view, ruleId);

			matchCt++;
			for (let r of ruleIds) {
				if (exempt(r)) {
					rules[r].exemptions++;
				}
			}

			let pkDimensions = (Object.values(view.dimension || {})).filter(pkNamingConvention);

			rule = 'K1';
			if (!pkDimensions.length) {
				if (!exempt(rule)) {
					rules[rule].errors++;
					messages.push({
						location, path, rule, level: 'error',
						description: 'No Primary Key Dimensions found in ' + view.$name,
					});
				}
				continue;
			}

			rule = 'K2';
			let declaredNs = pkDimensions
				.map(pkNamingConvention)
				.map((match) => match[1].replace('pk', ''))
				.map((n) => (n===''?'1':n))
				.filter(unique);
			if (declaredNs.length > 1) {
				if (!exempt(rule)) {
					rules[rule].errors++;
					messages.push({
						location, path, rule, level: 'error',
						description: `Different Primary Key Dimensions in ${view.$name} declare different column counts: ${declaredNs.join(', ')}`,
					});
					continue;
				}
			}

			let n = parseInt(declaredNs[0]);
			if (n != pkDimensions.length && n !== 0) {
				if (!exempt(rule)) {
					rules[rule].errors++;
					messages.push({
						location, path, rule, level: 'error',
						description: `View ${view.$name} has ${pkDimensions.length} Primary Key Dimension(s) but their names declare ${declaredNs[0]} columns`,
					});
					continue;
				}
			}

			rule = 'K3';
			let d;
			for (d=0; d<pkDimensions.length; d++) {
				let dimensions = Object.values(view.dimension || {});
				let dimension = dimensions[d];
				if (!pkNamingConvention(dimension)) {
					if (!exempt(rule)) {
						rules[rule].errors++;
						messages.push({
							location, path, rule, level: 'error',
							description: `Primary Key Dimensions in ${view.$name} are not declared before other dimensions`,
						});
					}
					break;
				}
			}

			rule = 'K4';
			let badDims = pkDimensions.filter((dim) => !dim.hidden);
			if (badDims.length) {
				if (!exempt(rule)) {
					let dimNames = badDims.map((dim) => dim.$name).join(', ');
					rules[rule].errors++;
					messages.push({
						location, path, rule, level: 'error',
						description: `Primary Key Dimensions (${dimNames}) in ${view.$name} are not hidden`,
						hint: `If you want the column to be user-facing, make it the sql for both a hidden Primary Key Dimension, and a separate non-hidden dimension.`,
					});
				}
				continue;
			}
		}
	}

	for (let rule of ruleIds) {
		messages.push({
			rule, level: 'info',
			description: `Evaluated ${matchCt} matches, with ${rules[rule].exemptions} exempt and ${rules[rule].errors} erroring`,
		});
	}
	return {
		messages,
	};
};
