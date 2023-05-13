/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'T2',
		match: `$.model.*.view.*`,
		description: 'SQL transformations should apply primary key column conventions',
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

const pkNamingConvention = (s) => s.match(/^(\d+pk|pk\d+)_.+$/);
const unique = (x, i, arr) => arr.indexOf(x) == i;

function ruleFn(match, path, project) {
	let messages = [];
	let view = match;
	let sql = view.sql_table_name || view.derived_table && view.derived_table.sql;
	if (!sql) {
		return true;
	}
	// Initialize the "stuff to check" by removing any string literals, comments, & LookML
	let remaining = sql
		.replace(/\n\s*-- ?--*\s*\n/g, ',[sep],') // Allow some flexibility in separator because --- is a syntax error in MySQL
		.replace(new RegExp([
			'[^\\\\\']+(\\\\.[^\\\\\']+)*\'',	// ' string literal
			'`[^\\\\`]+(\\\\.[^\\\\`]+)*`',	// ` quoted name
			'"[^\\\\"]+(\\\\.[^\\\\"]+)*"',	// " string literal or quoted name
			'--[^\\n]*(\\n|$)',				// -- Single line comment
			'/\\*[^*]*(\\*[^/][^*]*)*\\*/', // /* Multi-line comment
			'\\${[^}]*}',					// ${} LookML
			'{%.*?%}',						// {%%} Liquid
			'{{.*?}}',						// {{}} Liquid
		].join('|'), 'g'), '[nonsql]'); // TODO: Save the contents somewhere in case they were column names we need later?
	while (remaining) {
		let current; let rule;
		const innermostParens = remaining.match(/(^[\s\S]*)(\([^()]*\))([\s\S]*)/);
		if (innermostParens) {
			current = innermostParens[2].slice(1, -1);
			remaining = innermostParens[1] + '[paren]' + innermostParens[3];
		} else {
			current = remaining;
			remaining = false;
		}
		const snippet = current.replace(/\s+/g, ' ').slice(0, 15);
		if (!current.match(/^\s*SELECT\s/)) {
			// Non-subquery parenthetical
			continue;
		}
		if (current.match(/^\s*SELECT\s[^,]+(\bFROM|$)/)) {
			// Single column selects exempt per T9
			messages.push({
				rule: 'T2.7', level: 'verbose',
				description: `Single-column subquery (${snippet}...) in ${view.$name} not subject to rule T2 per rule T9`,
			});
			continue;
		}
		if (current.match(/^\s*SELECT\s+\*[\s\S]*?\bFROM\b(?!.*?(,|\bJOIN\b))/)) {
			// Single table *+projections selects exempt per T10
			messages.push({
				rule: 'T2.8', level: 'verbose',
				description: `Single-table subquery (${snippet}...) in ${view.$name} not subject to rule T2 per rule T10`,
			});
			continue;
		}
		const aliasRegexpStr = '(' + [
			'[a-zA-Z0-9_$]+',
			'`[^`\\\\n]+`',
			'"[^"\\\\n]+"',
			'\'[^\'\\\\n]+\'',
		].join('|') + ')\\s*$';
		const selections = current
			.replace(/^\s*SELECT\s+/, '').replace(/\s*FROM[\s\S]*$/, '')
			.split(',')
			.map((part) => part.trim().toLowerCase().replace(/\s+/, ' '))
			.filter(Boolean)
			.map((selection) => ({
				expression: selection.replace(new RegExp('\\s+as\\s+' + aliasRegexpStr, 'i'), ''),
				alias: (selection.match(new RegExp(aliasRegexpStr, 'i')) || [''])[0],
			}));
		const groupings = current
			.replace(/^[\s\S]*?(GROUP\s+BY\s+|$)/, '')
			.replace(/\s+(WHERE|HAVING|ORDER\s+BY|LIMIT|WINDOW|$)[\s\S]*$/, '')
			.split(',')
			.map((part) => part.trim().toLowerCase().replace(/\s+/, ' '))
			.filter(Boolean);
		const pks = selections.filter((s) => pkNamingConvention(s.alias));
		const actualPkCount = pks.length;

		rule = 'T2.1';
		if (actualPkCount === 0) {
			messages.push({
				rule, level: 'error',
				description: `No Primary Key columns/selectAliases found in "${snippet}" in ${view.$name}`,
			});
			continue;
		}
		const pkCountDeclarations = pks
			.map((p) => parseInt(p.alias.match(/\d+/)[0]))
			.filter(unique);

		if (pkCountDeclarations.length > 1) {
			messages.push({
				rule, level: 'error',
				description: `Primary Key columns in "${snippet}"  in ${view.$name} have mismatching numbers (${pkCountDeclarations.join(', ')})`,
			});
			continue;
		}
		const declaredPkCount = pkCountDeclarations[0];
		if (actualPkCount !== declaredPkCount) {
			messages.push({
				rule, level: 'error',
				description: `Primary Key columns in "${snippet}"  in ${view.$name} declare ${declaredPkCount} column(s), but there are ${actualPkCount}`,
			});
			continue;
		}

		rule='T2.2';
		if (!selections.slice(0, pks.length).every((s) => pkNamingConvention(s.alias))) {
			messages.push({
				rule, level: 'error',
				description: `Primary Key columns in "${snippet}" in ${view.$name} are not first`,
			});
			continue;
		}

		rule = 'T2.6';
		if (selections[actualPkCount].expression !== '[sep]') {
			messages.push({
				rule, level: 'error',
				description: `Primary Key columns/selectAliases in ${view.$name} should finish with ---`,
			});
			// no `continue;` Allow further rule checks to proceed
		}
		rule = 'T2.4';
		if (!groupings.length) {
			messages.push({
				rule, level: 'verbose',
				description: `LAMS cannot currently enforce rule T2.4. Perhaps use a comment in ${view.$name} to communicate whether/how the rule is followed in "${snippet}..."`,
			});
			continue;
		}
		let firstPksThatAreGroups = [];
		for (let p = 0; p < pks.length; p++) {
			if (groupings.some((g) => parseInt(g) && g - 1 === p || g === pks[p].expression)) {
				firstPksThatAreGroups.push(pks[p]);
			} else {
				break;
			}
		}
		rule = 'T2.3';
		if (!firstPksThatAreGroups.length) {
			messages.push({
				rule, level: 'error',
				description: `Transformation with GROUP BY in "${snippet}" in ${view.$name} does not begin with at least 1 grouped column as part of a primary key"`,
			});
			continue;
		}
		const allGroupsUsed = groupings.every((g) =>
			parseInt(g) && g <= pks.length
			|| pks.some((p) => p.expression === g),
		);
		rule = 'T2.5';
		if (!allGroupsUsed) {
			if (!pks[firstPksThatAreGroups.length]) {
				messages.push({
					rule, level: 'error',
					description: `Transformation with GROUP BY in "${snippet}" in ${view.$name} did not use all grouped columns in the pk, and does not continue with additional columns in the pk"`,
				});
				continue;
			}
			let nextCol = pks[firstPksThatAreGroups.length].expression;
			if (!nextCol.match(/\brow_number\s*\[paren]\s+over\s+\[paren]/)) {
				messages.push({
					rule, level: 'error',
					description: `Transformation with GROUP BY in "${snippet}" in ${view.$name} did not use all grouped columns in the pk, and the next column is not a ROW_NUMBER window"`,
				});
				continue;
			}
			messages.push({
				level: 'verbose', rule,
				description: `Transformation with GROUP BY in "${snippet}" in ${view.$name} appears valid, but LAMS does not verify the partition columns used in the window function (T7)`,
			});
		}
	}
	return messages;
}
