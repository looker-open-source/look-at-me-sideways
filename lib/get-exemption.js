/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
/** Checks whether an object directly declares an exemption for a given rule
 * @param {object} obj An object, usually from lookml-parser, to be checked for exemptions
 * @param {string} rule A string representing the rule to be checked for exemption from. E.g., 'K1'
 * @return {String|boolean} Return reason if rule is exempt otherwise false
 */
exports = module.exports = function getExemption(obj, rule) {
	return (obj && obj.rule_exemptions && typeof obj.rule_exemptions[rule] === 'string' && obj.rule_exemptions[rule])
		|| (obj && obj.exempt && typeof obj.exempt[rule] === 'object')
		|| false;
};
