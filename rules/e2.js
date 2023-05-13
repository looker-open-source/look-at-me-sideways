/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
// const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'E2',
		match: `$.model.*.explore.*.join.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	const join = match;
	const pkRegex = /^([0-9]+pk|pk[0-9]*)_([a-z0-9A-Z_]+)$/;
	const isFieldRef = (ref) => !ref.match(/^TABLE$|^SUPER$|^EXTENDED$|\.SQL_TABLE_NAME$/);
	const unique = (x, i, arr) => arr.indexOf(x)===i;
	const min = (a, b) => a<b?a:b;
	const max = (a, b) => a>b?a:b;
	const aliasFromRef = (ref) => ref.split('.')[0];

	let joinSql = join.sql || join.sql_on || '';
	if (joinSql.trim().length===0) {
		// Do not error on bare-joins
		// Do not error on foreign_key joins (check those with a different rule)
		return true;
	}
	let allRefs = (joinSql.match(/(?<=\${).*?(?=})/g)||[]).filter(isFieldRef);
	let reducedSql = joinSql
		.replace(new RegExp([
			'\'[^\\\\\']+(\\\\.[^\\\\\']+)*\'',	// ' string literal
			'`[^\\\\`]+(\\\\.[^\\\\`]+)*`',	// ` quoted name
			'"[^\\\\"]+(\\\\.[^\\\\"]+)*"',	// " string literal or quoted name
			'--[^\\n]*(\\n|$)',				// -- Single line comment
			'/\\*[^*]*(\\*[^/][^*]*)*\\*/', // /* Multi-line comment
		].join('|'), 'g'), '[nonsql]');
	let parensRegex = /\([\s\S]*?(?<!\\)\)/g;

	let messages = [];
	let maybeNote = '';
	if (reducedSql.match(parensRegex)) {
		maybeNote = '. Note: Equality constraints are only checked in the top-level of the ON clause (not within parentheses)';
		while (reducedSql.match(parensRegex)) {
			reducedSql = reducedSql.replace(parensRegex, '');
		}
	}

	if (join.sql !== undefined && !reducedSql.match(/\bJOIN\b/)) {
		// joins using 'sql' that do not actually result in a SQL JOIN, e.g. for field-only views
		return {level: 'verbose', description: `No relevant SQL detected${maybeNote}`};
	}
	if (reducedSql.match(/\bOR\b/i)) {
		return 'Compound equality constraints are only established by AND\'ed equality expressions. Top-level OR is not allowed.';
	}

	let constrainedRefs = (reducedSql.match(/(?<=[^><]=\s*\${).*?(?=})|(?<=\${).*?(?=}\s*=)/g)||[])
		.filter(isFieldRef);
	let [otherCardinality, ownCardinality] = (join.relationship || 'many_to_one').split('_to_');
	let oneAliases = []
		.concat(ownCardinality === 'one' && join.$name)
		.concat(otherCardinality === 'one' &&
			allRefs.map(aliasFromRef)
				.filter((alias) => alias != join.$name),
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
			messages.push(`No PKs dimensions used for ${oneAlias} in ${join.$name} join`);
			continue;
		}
		let pksColumnDeclarations = pksForAlias.map((pk)=>parseInt(pk.match(/\d+/)||'1'));
		let maxDeclaration = pksColumnDeclarations.reduce(max);
		let minDeclaration = pksColumnDeclarations.reduce(min);
		if (minDeclaration !== maxDeclaration) {
			messages.push(
				`${oneAlias} PK references in ${join.$name} join specify different column counts (${minDeclaration},${maxDeclaration})`,
			);
			continue;
		}
		if (pksForAlias.length !== maxDeclaration) {
			messages.push(
				`The number of PKs used (${pksForAlias.length}) for ${oneAlias} does not match the declared number of PK columns (${maxDeclaration}) in ${join.$name} join${maybeNote}`,
			);
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
				messages.push(
					`${oneAlias}'s PK ${pk} is not used in an equality constraint in ${join.$name} join${maybeNote}`,
				);
			}
		}
	}

	return messages;
}
