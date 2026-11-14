/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const IGNORED_REFS = new Set(['TABLE', 'SUPER', 'EXTENDED']);

function getJoinParentAliases(join, exploreName) {
	const sql = join.sql_on || join.sql;
	if (!sql || typeof sql !== 'string') {
		return join.foreign_key ? [exploreName] : [];
	}
	const aliases = new Set();
	const regex = /\$\{([a-zA-Z0-9_]+)\.(?!SQL_TABLE_NAME\b)/g;
	let match;
	while ((match = regex.exec(sql)) !== null) {
		const alias = match[1];
		if (!IGNORED_REFS.has(alias) && alias !== join.$name) {
			aliases.add(alias);
		}
	}
	return [...aliases];
}

module.exports = function(project) {
	const rule = {
		$name: 'E5',
		description: 'Explores\' joins should not cause multiplicative fanout or spurious relationships.',
		match: '$.model.*.explore.*',
		ruleFn: (explore, path) => {
			if (!explore || !explore.join) {
				return true;
			}
			const exploreName = explore.$name || path[3];
			const joins = Object.values(explore.join).filter(Boolean);
			const errors = [];

			for (const join of joins) {
				if (join.relationship === 'many_to_many') {
					errors.push(
						`Join "${join.$name}" in explore "${exploreName}" has relationship: many_to_many, which can cause multiplicative fanout.`,
					);
				}
			}

			const oneToManyJoins = joins.filter((j) => j.relationship === 'one_to_many');
			if (oneToManyJoins.length > 1) {
				const hasOneToManyChild = new Set();
				for (const join of oneToManyJoins) {
					for (const parentAlias of getJoinParentAliases(join, exploreName)) {
						hasOneToManyChild.add(parentAlias);
					}
				}
				const leaves = oneToManyJoins.filter((j) => !hasOneToManyChild.has(j.$name));
				if (leaves.length > 1) {
					const leafNames = leaves.map((j) => j.$name).join(', ');
					errors.push(
						`Explore "${exploreName}" has multiple branching one_to_many join paths (${leafNames}), which can cause multiplicative fanout.`,
					);
				}
			}

			return errors.length ? errors : true;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
