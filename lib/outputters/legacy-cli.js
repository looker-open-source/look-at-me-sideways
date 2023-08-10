const defaultConsole = console;

/**
 * Output errors to the command line in a legacy format. Available for backwards compatibility, but 'lines' is generally better.
 *
 * @param {array}	messages	Array of messages
 * @return {void}
 */
function legacyCli(messages, {console=defaultConsole}={}) {
	let maxArrayLength = 5000;
	let errors = messages.filter((msg) => {
		return msg.level === 'error';
	});
	if (errors.length) {
		console.log('Errors:');
		console.dir(errors, {maxArrayLength});
	}
}

module.exports = legacyCli