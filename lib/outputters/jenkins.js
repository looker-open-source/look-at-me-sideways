const defaultConsole = console;
const defaultFs = require('node:fs/promises');

/**
 * Output results.json for sample Jenkins configuration. To be used with markdown as well by default.
 *
 * @param {array}	messages	Array of messages
 * @return {void}
 */
async function jenkins(messages, {
	dateOutput,
	console = defaultConsole,
	fs = defaultFs
	}={}) {
	let errors = messages.filter((msg) => {
		return msg.level === 'error';
	});
	const buildStatus = errors.length ? 'FAILED' : 'PASSED';
	console.log(`BUILD ${buildStatus}: ${errors.length} errors found. Check .md files for details.`);
	let json = JSON.stringify({
		buildStatus: buildStatus,
		errors: errors.length,
		warnings: 0,
		lamsErrors: 0,
	});
	await fs.writeFile('results.json', json, 'utf8');
}

module.exports = jenkins