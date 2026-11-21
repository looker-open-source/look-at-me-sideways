/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const DEFAULT_TIMEFRAMES = ['raw', 'time', 'date', 'week', 'month', 'quarter', 'year'];

function resolveDimensionInView(view, dimName) {
	if (!view || !dimName) {
		return false;
	}
	if (view.dimension && view.dimension[dimName]) {
		return true;
	}
	const dgs = view.dimension_group || {};
	for (const [dgName, dg] of Object.entries(dgs)) {
		if (!dg) {
			continue;
		}
		const timeframes = Array.isArray(dg.timeframes) && dg.timeframes.length
			? dg.timeframes
			: DEFAULT_TIMEFRAMES;
		for (const tf of timeframes) {
			if (`${dgName}_${tf}` === dimName) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Return a map of { [aliasName]: underlyingViewName } for all views exposed in `explore`.
 * @param {object} explore
 * @return {Object<string, string>}
 */
function getExploreViewAliases(explore) {
	const aliases = {};
	if (!explore) {
		return aliases;
	}
	const baseAlias = explore.view_name || explore.$name;
	const baseView = explore.from || explore.view_name || explore.$name;
	if (baseAlias && baseView) {
		aliases[baseAlias] = baseView;
	}
	for (const join of Object.values(explore.join || {})) {
		if (!join || !join.$name) {
			continue;
		}
		const joinAlias = join.$name;
		const joinView = join.from || join.view_name || join.$name;
		aliases[joinAlias] = joinView;
	}
	return aliases;
}

module.exports = function(project) {
	const rule = {
		$name: 'F10',
		match: `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter].*`,
		description: 'Fields using suggest_explore or suggest_dimension must reference an explore and dimension available in the model.',
		ruleFn: (field, path, proj) => {
			if (!field || (!field.suggest_explore && !field.suggest_dimension)) {
				return true;
			}
			const modelKey = path[1];
			const currentViewName = path[3];
			const model = proj && proj.model && proj.model[modelKey];
			if (!model) {
				return true;
			}
			const views = model.view || {};
			const explores = model.explore || {};

			const suggestExploreName = field.suggest_explore;
			const suggestDimension = field.suggest_dimension;

			if (suggestExploreName) {
				const targetExplore = explores[suggestExploreName];
				if (!targetExplore) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_explore "${suggestExploreName}", which does not exist in model "${modelKey}".`;
				}
				if (suggestDimension) {
					const aliases = getExploreViewAliases(targetExplore);
					const parts = String(suggestDimension).split('.');
					if (parts.length === 2) {
						const [targetAlias, targetDim] = parts;
						const underlyingViewName = aliases[targetAlias];
						if (!underlyingViewName) {
							return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", but "${targetAlias}" is not available in suggest_explore "${suggestExploreName}".`;
						}
						if (!resolveDimensionInView(views[underlyingViewName], targetDim)) {
							return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", which does not exist in view "${underlyingViewName}".`;
						}
					} else {
						const targetDim = parts[0];
						const isCurrentViewInExplore = Object.values(aliases).includes(currentViewName) || Boolean(aliases[currentViewName]);
						if (!isCurrentViewInExplore) {
							return `Field "${currentViewName}.${field.$name}" specifies unqualified suggest_dimension "${suggestDimension}", but view "${currentViewName}" is not available in suggest_explore "${suggestExploreName}".`;
						}
						if (!resolveDimensionInView(views[currentViewName], targetDim)) {
							return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", which does not exist in view "${currentViewName}".`;
						}
					}
				}
				return true;
			}

			// suggest_explore is NOT specified, only suggest_dimension
			const parts = String(suggestDimension).split('.');
			if (parts.length === 1) {
				const targetDim = parts[0];
				if (!resolveDimensionInView(views[currentViewName], targetDim)) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", which does not exist in view "${currentViewName}".`;
				}
				return true;
			}

			const [targetAlias, targetDim] = parts;
			const exploresUsingCurrentView = Object.values(explores).filter((exp) => {
				if (!exp || exp.hidden) {
					return false;
				}
				const aliases = getExploreViewAliases(exp);
				return Object.values(aliases).includes(currentViewName) || Boolean(aliases[currentViewName]);
			});

			if (exploresUsingCurrentView.length === 0) {
				if (!views[targetAlias]) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", but view "${targetAlias}" does not exist in model "${modelKey}".`;
				}
				if (!resolveDimensionInView(views[targetAlias], targetDim)) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", which does not exist in view "${targetAlias}".`;
				}
				return true;
			}

			for (const exp of exploresUsingCurrentView) {
				const aliases = getExploreViewAliases(exp);
				const underlyingViewName = aliases[targetAlias];
				if (!underlyingViewName) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}" without suggest_explore, but "${targetAlias}" is not available in explore "${exp.$name}".`;
				}
				if (!resolveDimensionInView(views[underlyingViewName], targetDim)) {
					return `Field "${currentViewName}.${field.$name}" specifies suggest_dimension "${suggestDimension}", which does not exist in view "${underlyingViewName}".`;
				}
			}

			return true;
		},
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});
	return {messages, rule};
};
