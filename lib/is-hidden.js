/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const FIELD_TYPES = new Set(['dimension', 'dimension_group', 'measure', 'filter', 'parameter']);

function getAtPath(root, path) {
	let cur = root;
	for (const seg of path) {
		if (cur == null || typeof cur !== 'object') {
			return undefined;
		}
		cur = cur[seg];
	}
	return cur;
}

/**
 * Determine whether a LookML node (explore or field) at `path` is hidden,
 * accounting for view-level `fields_hidden_by_default`.
 * @param {Array<string|number>} path Path segments from project root
 * @param {object} project Parsed LookML project
 * @return {boolean}
 */
module.exports = function isHidden(path, project) {
	if (!Array.isArray(path) || !project) {
		return false;
	}
	const node = getAtPath(project, path);
	if (!node || typeof node !== 'object') {
		return false;
	}
	if (node.hidden !== undefined) {
		return Boolean(node.hidden);
	}
	if (path.length >= 4 && path[path.length - 4] === 'view' && FIELD_TYPES.has(path[path.length - 2])) {
		const view = getAtPath(project, path.slice(0, -2));
		if (view && view.fields_hidden_by_default !== undefined) {
			return Boolean(view.fields_hidden_by_default);
		}
	}
	return false;
};
