/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');
// const deepGet = require('../../lib/deep-get.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'E2',
		match: `$.model.*.explore.*.join.*`,
		description: 'The "one" table in any join should be joined on equality constraints on all of the Primary Key Dimensions.',
		ruleFn,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

function resolveExploreView(oneAlias, path, project) {
	const model = project && project.model && project.model[path[1]];
	if (!model || !model.view) {
		return null;
	}
	const explore = model.explore && model.explore[path[3]];
	let viewName = oneAlias;
	if (explore) {
		const baseAlias = explore.view_name || explore.$name;
		if (oneAlias === baseAlias) {
			viewName = explore.from || explore.view_name || explore.$name;
		} else if (explore.join && explore.join[oneAlias]) {
			const j = explore.join[oneAlias];
			viewName = j.from || j.view_name || j.$name;
		}
	}
	return model.view[viewName] || null;
}

function getConstrainedFieldsForAlias(constrainedRefs, oneAlias) {
	const fields = new Set();
	for (const ref of constrainedRefs) {
		const [refAlias, refField] = ref.split('.');
		if (refAlias === oneAlias && refField) {
			fields.add(refField);
		}
	}
	return fields;
}

function findDimensionsForTableColumn(oneView, colName) {
	const target = String(colName).toLowerCase();
	const dims = Object.values((oneView && oneView.dimension) || {});
	const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const tableColRegex = new RegExp(`\\$\\{TABLE\\}\\s*\\.\\s*["\`\\[]?${escaped}["\`\\]]?\\b`, 'i');
	return dims.filter((d) =>
		(d.$name && d.$name.toLowerCase() === target) ||
		(d.sql && tableColRegex.test(String(d.sql))),
	);
}

function checkPrimaryKeyDim(oneView, constrainedFields) {
	const dims = Object.values((oneView && oneView.dimension) || {});
	const pkDims = dims.filter((d) => d.primary_key);
	for (const pkDim of pkDims) {
		if (constrainedFields.has(pkDim.$name)) {
			return true;
		}
		if (!pkDim.sql) {
			continue;
		}
		const sqlStr = String(pkDim.sql);
		const refs = sqlStr.match(/(?<=\$\{)[^}]+(?=\})/g) || [];
		const constituentSets = [];
		for (const ref of refs) {
			if (/^TABLE$|^SUPER$|^EXTENDED$|\.SQL_TABLE_NAME$/i.test(ref)) {
				continue;
			}
			const fieldName = ref.includes('.') ? ref.split('.').pop() : ref;
			constituentSets.push([fieldName]);
		}
		const tableColMatches = sqlStr.matchAll(/\$\{TABLE\}\s*\.\s*["`[]?([a-zA-Z0-9_]+)["`\]]?/gi);
		for (const m of tableColMatches) {
			const matchingDims = findDimensionsForTableColumn(oneView, m[1]).map((d) => d.$name);
			if (matchingDims.length) {
				constituentSets.push(matchingDims);
			} else {
				constituentSets.push([]);
			}
		}
		if (constituentSets.length > 0 && constituentSets.every((candidates) => candidates.some((c) => constrainedFields.has(c)))) {
			return true;
		}
	}
	return false;
}

function stripOuterParensAndComments(sql) {
	let s = String(sql)
		.replace(/--[^\n]*(\n|$)/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ');
	const parensRegex = /\([\s\S]*?(?<!\\)\)/g;
	while (parensRegex.test(s)) {
		s = s.replace(parensRegex, ' ');
	}
	return s;
}

function extractColIdentifier(expr) {
	const cleaned = expr.replace(/["`[\]]/g, '').trim();
	const parts = cleaned.split(/\s+/);
	const last = parts[parts.length - 1] || '';
	return (last.includes('.') ? last.split('.').pop() : last).toLowerCase();
}

function extractDtUniqueColumnSets(sql) {
	const topSql = stripOuterParensAndComments(sql);
	const selectMatches = [...topSql.matchAll(/\bSELECT\s+(DISTINCT\s+)?([\s\S]*?)\bFROM\b/gi)];
	const lastSelect = selectMatches[selectMatches.length - 1];
	const selectItems = lastSelect
		? lastSelect[2].split(',').map((part) => extractColIdentifier(part)).filter(Boolean)
		: [];

	const groupByMatches = [...topSql.matchAll(/\bGROUP\s+BY\s+([\s\S]*?)(?=\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|\bWINDOW\b|\bQUALIFY\b|\bUNION\b|;|$)/gi)];
	const lastGroupBy = groupByMatches[groupByMatches.length - 1];
	if (lastGroupBy) {
		const cols = lastGroupBy[1].split(',').map((raw) => {
			const trimmed = raw.trim();
			if (/^\d+$/.test(trimmed)) {
				return selectItems[parseInt(trimmed, 10) - 1] || '';
			}
			return extractColIdentifier(trimmed);
		});
		if (cols.some((c) => !c)) {
			return null;
		}
		return cols;
	}

	if (lastSelect && lastSelect[1]) {
		return selectItems.length ? selectItems : null;
	}

	return null;
}

function checkDtUniqueSet(oneView, constrainedFields) {
	const dtSql = oneView && oneView.derived_table && oneView.derived_table.sql;
	if (!dtSql) {
		return false;
	}
	const cols = extractDtUniqueColumnSets(dtSql);
	if (!cols || !cols.length) {
		return false;
	}
	return cols.every((col) => {
		const matchingDims = findDimensionsForTableColumn(oneView, col);
		return matchingDims.some((d) => constrainedFields.has(d.$name));
	});
}

function ruleFn(match, path, project, options={}) {
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

	if (/\bUNNEST\s*\(/i.test(reducedSql) || /\bUNNEST\s*\(/i.test(join.sql_table_name || '')) {
		return true;
	}

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

	const strictMode = Boolean(options.strict_mode);

	for (let oneAlias of oneAliases) {
		let pksForAlias = allRefs
			.map((ref) => ref.split('.'))
			.filter(([refAlias, refField]) => refAlias === oneAlias)
			.filter(([refAlias, refField]) => refField.match(pkRegex))
			.map(([refAlias, refField]) => refField)
			.filter(unique);

		if (!strictMode) {
			const constrainedFields = getConstrainedFieldsForAlias(constrainedRefs, oneAlias);
			const oneView = resolveExploreView(oneAlias, path, project);
			if (oneView && (checkPrimaryKeyDim(oneView, constrainedFields) || checkDtUniqueSet(oneView, constrainedFields))) {
				continue;
			}
			if (!pksForAlias.length) {
				messages.push(`No PK dimensions, primary_key:yes field, or DT GROUP BY/DISTINCT columns are constrained for ${oneAlias} in ${join.$name} join${maybeNote}`);
				continue;
			}
		} else if (!pksForAlias.length) {
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
