/**
 * Given a location string, returns an array representing a path to a json location
 * @return {string} The formatted location.
 */

module.exports = function pathForLocation(str) {
	const elements = [];
	let currentToken = "";
	let isEscaped = false;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];

		if (isEscaped) {
			currentToken += char;
			isEscaped = false;
			} 
		else if (char === '\\') {
			isEscaped = true;
			}
		else if (char === ':' || char === '/') {
			if (currentToken.length > 0) {
			elements.push(currentToken);
			}
			currentToken = "";
			}
		else {
			currentToken += char;
			}
		}

	if (currentToken.length > 0) {
		elements.push(currentToken);
		}

	return elements;
	}