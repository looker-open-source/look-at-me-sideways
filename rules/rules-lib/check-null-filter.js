/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

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
		aliases[join.$name] = join.from || join.view_name || join.$name;
	}
	return aliases;
}

function normalizeFilterEntries(filters) {
	if (!filters) {
		return [];
	}
	const list = Array.isArray(filters) ? filters : [filters];
	const pairs = [];
	for (const entry of list) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}
		if (typeof entry.field === 'string') {
			pairs.push([entry.field.trim(), String(entry.value ?? '')]);
		} else {
			for (const [k, v] of Object.entries(entry)) {
				if (!k.startsWith('$')) {
					pairs.push([k.trim(), String(v ?? '')]);
				}
			}
		}
	}
	return pairs;
}

function resolveTargetField(fieldRef, {model, currentViewName, explore}) {
	const views = (model && model.view) || {};
	const parts = String(fieldRef).split('.');
	let viewName;
	let fieldName;
	if (parts.length === 2) {
		const [alias, name] = parts;
		fieldName = name;
		if (explore) {
			const aliases = getExploreViewAliases(explore);
			viewName = aliases[alias] || alias;
		} else {
			viewName = alias;
		}
	} else {
		fieldName = parts[0];
		viewName = currentViewName || (explore && (explore.from || explore.view_name || explore.$name));
	}
	const view = views[viewName];
	if (!view) {
		return null;
	}
	for (const coll of ['dimension', 'filter', 'parameter', 'measure']) {
		if (view[coll] && view[coll][fieldName]) {
			return view[coll][fieldName];
		}
	}
	if (fieldName.endsWith('_raw')) {
		const dgName = fieldName.slice(0, -4);
		const dg = view.dimension_group && view.dimension_group[dgName];
		if (dg && dg.type === 'time' && (!Array.isArray(dg.timeframes) || dg.timeframes.includes('raw'))) {
			return {isRawTimeframe: true, dgName};
		}
	}
	return null;
}

/**
 * Validate `filters` entries for common `"NOT NULL"` vs `"-NULL"` mistakes
 * based on the target field's LookML type (and disallowing `*_raw` timeframes).
 * @param {Array|object} filters
 * @param {object} context
 * @param {object} context.model
 * @param {string=} context.currentViewName
 * @param {object=} context.explore
 * @return {string[]} Array of error descriptions
 */
module.exports = function checkNullFilters(filters, {model, currentViewName, explore}) {
	const errors = [];
	for (const [fieldRef, rawVal] of normalizeFilterEntries(filters)) {
		const val = rawVal.trim();
		const targetField = resolveTargetField(fieldRef, {model, currentViewName, explore});
		if (!targetField) {
			continue;
		}
		if (targetField.isRawTimeframe) {
			errors.push(`Filter on raw timeframe "${fieldRef}" is not supported by Looker; use a non-raw timeframe (such as "${targetField.dgName}_date" or "${targetField.dgName}_time") instead.`);
			continue;
		}
		const isNotNullText = /^NOT\s+NULL$/i.test(val);
		const isMinusNull = /^-NULL$/i.test(val);
		if (!isNotNullText && !isMinusNull) {
			continue;
		}
		const fieldType = targetField.type;
		const isStringField = targetField.$type === 'dimension' &&
			(!fieldType || fieldType === 'string' || fieldType === 'zipcode');
		const isNumberField = fieldType === 'number';

		if (isStringField && isNotNullText) {
			errors.push(`Filter on string field "${fieldRef}" uses "${val}", which matches the literal string "${val}" instead of SQL IS NOT NULL; use "-NULL" instead.`);
		} else if (isNumberField && isMinusNull) {
			errors.push(`Filter on numeric field "${fieldRef}" uses "${val}"; use "NOT NULL" instead.`);
		}
	}
	return errors;
};
