/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const DEFAULT_FRAGMENTS = {
	min: ['min', 'minimum', 'first', 'earliest'],
	max: ['max', 'maximum', 'last', 'latest'],
	any: ['any', 'sample'],
};

function getDerivedTableSqlStrings(dt) {
	if (!dt || typeof dt !== 'object') {
		return [];
	}
	const sqls = [];
	if (typeof dt.sql === 'string') {
		sqls.push(dt.sql);
	}
	if (typeof dt.sql_create === 'string') {
		sqls.push(dt.sql_create);
	}
	if (dt.create_process && dt.create_process.sql_step) {
		const steps = Array.isArray(dt.create_process.sql_step)
			? dt.create_process.sql_step
			: [dt.create_process.sql_step];
		for (const step of steps) {
			if (step && typeof step.sql === 'string') {
				sqls.push(step.sql);
			}
		}
	}
	return sqls;
}

function sanitizeSql(sql) {
	return sql
		.replace(/--[^\n]*(\n|$)/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, '\'\'');
}

function splitTopLevelCommas(str) {
	const items = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		if (ch === '(') {
			depth++;
		} else if (ch === ')' && depth > 0) {
			depth--;
		} else if (ch === ',' && depth === 0) {
			items.push(str.slice(start, i));
			start = i + 1;
		}
	}
	items.push(str.slice(start));
	return items.map((s) => s.trim()).filter(Boolean);
}

function extractSelectItems(sql) {
	const cleaned = sanitizeSql(sql);
	const items = [];
	const selectRegex = /\bSELECT\b(?:\s+(?:DISTINCT|ALL)\b)?/gi;
	let match;
	while ((match = selectRegex.exec(cleaned)) !== null) {
		let i = match.index + match[0].length;
		let depth = 0;
		let end = cleaned.length;
		while (i < cleaned.length) {
			const ch = cleaned[i];
			if (ch === '(') {
				depth++;
				i++;
			} else if (ch === ')') {
				if (depth === 0) {
					end = i;
					break;
				}
				depth--;
				i++;
			} else if (depth === 0 && /^(?:FROM|WHERE|GROUP|HAVING|ORDER|LIMIT|UNION|INTERSECT|EXCEPT)\b/i.test(cleaned.slice(i))) {
				// Ensure we are at a word boundary
				const prev = i > 0 ? cleaned[i - 1] : ' ';
				if (!/[a-zA-Z0-9_$]/.test(prev)) {
					end = i;
					break;
				}
				i++;
			} else if (depth === 0 && ch === ';') {
				end = i;
				break;
			} else {
				i++;
			}
		}
		const selectList = cleaned.slice(match.index + match[0].length, end);
		items.push(...splitTopLevelCommas(selectList));
	}
	return items;
}

function extractAlias(item) {
	const asMatch = item.match(/\bAS\s+["`[]?([a-zA-Z0-9_]+)["`\]]?\s*$/i);
	if (asMatch) {
		return asMatch[1];
	}
	const implicitMatch = item.match(/(?:\)|[a-zA-Z0-9_]+)\s+["`[]?([a-zA-Z0-9_]+)["`\]]?\s*$/);
	if (implicitMatch && !/^(?:END|NULL|TRUE|FALSE)$/i.test(implicitMatch[1])) {
		return implicitMatch[1];
	}
	return '';
}

function isGuardedItem(item) {
	const hasMin = /\bMIN\s*\(/i.test(item);
	const hasMax = /\bMAX\s*\(/i.test(item);
	const hasAssertion = /\bCASE\b|\bERROR\s*\(|\bRAISE\s*\(/i.test(item);
	return hasMin && hasMax && hasAssertion;
}

function buildFragments(options, snakeKey, camelKey, defaults) {
	const custom = (options && (options[snakeKey] || options[camelKey])) || [];
	const list = Array.isArray(custom) ? custom : [custom];
	return [...defaults, ...list.map((s) => String(s).toLowerCase()).filter(Boolean)];
}

module.exports = function(project) {
	const rule = {
		$name: 'T11',
		description: 'MIN, MAX, and ANY aggregates in derived tables should be asserted (e.g. via MIN <> MAX) or aliased to indicate they are min/max/any values.',
		match: '$.model.*.view.*.derived_table',
		ruleFn: (dt, path, proj, options) => {
			const sqls = getDerivedTableSqlStrings(dt);
			if (sqls.length === 0) {
				return true;
			}
			const fragments = {
				min: buildFragments(options, 'min_fragments', 'minFragments', DEFAULT_FRAGMENTS.min),
				max: buildFragments(options, 'max_fragments', 'maxFragments', DEFAULT_FRAGMENTS.max),
				any: buildFragments(options, 'any_fragments', 'anyFragments', DEFAULT_FRAGMENTS.any),
			};

			const errors = [];
			const viewName = path[3];
			for (const sql of sqls) {
				for (const item of extractSelectItems(sql)) {
					if (isGuardedItem(item)) {
						continue;
					}
					const alias = extractAlias(item).toLowerCase();
					const checks = [
						{name: 'MIN', regex: /\bMIN\s*\(/i, allowed: fragments.min},
						{name: 'MAX', regex: /\bMAX\s*\(/i, allowed: fragments.max},
						{name: 'ANY', regex: /\b(?:ANY|ANY_VALUE)\s*\(/i, allowed: fragments.any},
					];
					for (const {name, regex, allowed} of checks) {
						if (regex.test(item) && !allowed.some((frag) => alias.includes(frag))) {
							errors.push(
								`Derived table in view "${viewName}" uses unguarded ${name}() without an explicit ${name.toLowerCase()}-indicating alias (found "${alias || '(unaliased)'}").`,
							);
						}
					}
				}
			}

			return errors.length ? errors : true;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
