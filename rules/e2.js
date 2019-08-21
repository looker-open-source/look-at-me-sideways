/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E2';
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
	let models = Object.values(project.model || {});
	const pkRegex = /^([0-9]+pk|pk[0-9]+)_([a-z0-9A-Z_]+)$/;
	const isFieldRef = (ref) => !ref.match(/^TABLE$|^SUPER$|^EXTENDED$|\.SQL_TABLE_NAME$/);
	const unique = (x, i, arr) => arr.indexOf(x)===i;
	const min = (a, b) => a<b?a:b;
	const max = (a, b) => a>b?a:b;
	const aliasFromRef = (ref) => ref.split('.')[0];
	for (let model of models) {
		let explores = Object.values(model.explore || {});
		for (let explore of explores) {
			let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
			let joins = Object.values(explore.join || {});
			for (let join of joins) {
				let location = `model:${model._model}/explore:${explore._explore}/join:${join._join}`;
				let exempt = getExemption(join, rule) || getExemption(explore, rule) || getExemption(model, rule);
				let joinSql = join.sql || join.sql_on || '';
				let allRefs = (joinSql.match(/(?<=\${).*?(?=})/g)||[]).filter(isFieldRef);
				let reducedSql = joinSql
					.replace(new RegExp([
						'[^\\\\\']+(\\\\.[^\\\\\']+)*\'',	// ' string literal
						'`[^\\\\`]+(\\\\.[^\\\\`]+)*`',	// ` quoted name
						'"[^\\\\"]+(\\\\.[^\\\\"]+)*"',	// " string literal or quoted name
						'--[^\\n]*(\\n|$)',				// -- Single line comment
						'/\\*[^*]*(\\*[^/][^*]*)*\\*/', // /* Multi-line comment
					].join('|')), '[nonsql]');
				let parensRegex = /\([\s\S]*?(?<!\\)\)/g;
				if (reducedSql.match(parensRegex)) {
					messages.push({
						path, location, rule, level: 'info',
						description: 'Equality constraints are only checked in the top-level of the ON clause (not within parentheses)',
					});
					while (reducedSql.match(parensRegex)) {
						reducedSql = reducedSql.replace(parensRegex, '');
					}
				}
				if (join.sql !== undefined && !reducedSql.match(/\bJOIN\b/)) {
					// joins using 'sql' that do not actually result in a SQL JOIN, e.g. for field-only views
					continue;
				}
				if (reducedSql.match(/\bOR\b/i)) {
					messages.push({
						path, location, rule, exempt, level: 'error',
						description: 'Compound equality constraints are only established by AND\'ed equality expressions. OR is not allowed.',
					});
					continue;
				}
				let constrainedRefs = (reducedSql.match(/(?<=[^><]=\s*\${).*?(?=})|(?<=\${).*?(?=}\s*=)/g)||[])
					.filter(isFieldRef);
				let [otherCardinality, ownCardinality] = (join.relationship || 'many_to_one').split('_to_');
				let oneAliases = []
					.concat(ownCardinality === 'one' && join._join)
					.concat(otherCardinality === 'one' &&
						allRefs.map(aliasFromRef)
							.filter((alias) => alias != join._join)
					)
					.filter(Boolean)
					.filter(unique);
				for (let oneAlias of oneAliases) {
					let pksForAlias = allRefs
						.map((ref) => ref.split('.'))
						.filter(([refAlias, refField]) => refAlias === oneAlias)
						.filter(([refAlias, refField]) => refField.match(pkRegex))
						.map(([refAlias, refField]) => refField)
						.filter(unique);
					if (!pksForAlias.length) {
						ok = false;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `No PKs dimensions used for ${oneAlias} in ${join._join} join`,
						});
						continue;
					}
					let pksColumnDeclarations = pksForAlias.map((pk)=>parseInt(pk.match(/\d+/)));
					let maxDeclaration = pksColumnDeclarations.reduce(max);
					let minDeclaration = pksColumnDeclarations.reduce(min);
					if (minDeclaration !== maxDeclaration) {
						ok = false;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `${oneAlias} PK references in ${join._join} join specify different column counts (${minDeclaration},${maxDeclaration})`,
						});
						continue;
					}
					if (pksForAlias.length !== maxDeclaration) {
						ok = false;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `The number of PKs used (${pksForAlias.length}) for ${oneAlias} does not match the declared number of PK columns (${maxDeclaration}) in ${join._join} join`,
						});
						continue;
					}

					let constrainedPksForAlias = constrainedRefs
						.map((ref) => ref.split('.'))
						.filter(([refAlias, refField]) => refAlias === oneAlias)
						.filter(([refAlias, refField]) => refField.match(pkRegex))
						.map(([refAlias, refField]) => refField)
						.filter(unique);

					for (let pk of pksForAlias) {
						if (!constrainedPksForAlias.includes(pk)) {
							ok = false;
							messages.push({
								location, path, rule, exempt, level: 'error',
								description: `${oneAlias}'s PK ${pk} is not used in an equality constraint in ${join._join} join`,
							});
						}
					}
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: 'All primary keys from `one` cardinality views apply equality constraints to all primary keys',
		});
	}
	return {
		messages,
	};
};
