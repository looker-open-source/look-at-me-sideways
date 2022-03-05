/**
* CodeError
*/
class CodeError extends Error {
	/**
	* Throw custom error.
	* @param {string} message The error message.
	* @param {number} code The error code.
	*/
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

module.exports = CodeError;
