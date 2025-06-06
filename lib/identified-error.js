/**
* IdentifiedError
*/
class IdentifiedError extends Error {
	/**
	* Throw custom error.
	* @param {number} errorId The error ID.
	* @param {string} message The error message.
	*/
	constructor(errorId, message) {
		super(message);
		this.errorId = errorId;
	}
}

module.exports = IdentifiedError;
