/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

function getAlwaysFilterFieldRefs(alwaysFilter) {
	if (!alwaysFilter || !Array.isArray(alwaysFilter.filters)) {
		return [];
	}
	const refs = [];
	for (const entry of alwaysFilter.filters) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}
		if (typeof entry.field === 'string') {
			refs.push(entry.field.trim());
		} else {
			for (const key of Object.keys(entry)) {
				if (!key.startsWith('$')) {
					refs.push(key.trim());
				}
			}
		}
	}
	return refs;
}

module.exports = function(project) {
	const rule = {
		$name: 'E4',
		description: 'Non-hidden explores based on a view with a required_filter must declare an always_filter referencing that field.',
		match: '$.model.*.explore.*',
		ruleFn: (explore, path, proj) => {
			if (!explore || explore.hidden) {
				return true;
			}
			const modelKey = path[1];
			const model = proj && proj.model && proj.model[modelKey];
			if (!model || !model.view) {
				return true;
			}
			const exploreName = explore.$name || path[3];
			const baseViewName = explore.from || explore.view_name || exploreName;
			const baseView = model.view[baseViewName];
			if (!baseView || !baseView.required_filter) {
				return true;
			}

			const requiredField = String(baseView.required_filter).trim();
			const allowedRefs = new Set([
				requiredField,
				`${exploreName}.${requiredField}`,
				`${baseViewName}.${requiredField}`,
			]);

			const filterRefs = getAlwaysFilterFieldRefs(explore.always_filter);
			if (filterRefs.some((ref) => allowedRefs.has(ref))) {
				return true;
			}

			return `Explore "${exploreName}" is based on view "${baseViewName}" which declares required_filter "${requiredField}", so it must include an always_filter referencing "${exploreName}.${requiredField}".`;
		},
	};
	return checkCustomRule(rule, project, {ruleSource: 'internal'});
};
