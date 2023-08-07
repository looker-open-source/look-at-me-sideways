/**
 * Given an array representing a path to a json location, formats it as a more readable LookML-specific "location" string.
 * @param {Array} pathArray Path array to format.
 * @return {string} The formatted location.
 */

module.exports = function formatLocation(pathArray) {
	return pathArray?.join('/').replace(
		/(^|\/)(model|file|view|join|explore|datagroup|dimension|measure|filter|parameter)\//g,
		(match) => match.slice(0, -1) + ':',
	);
}