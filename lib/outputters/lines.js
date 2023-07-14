const defaultConsole = console;

/**
 * Output info and errors to the command line in a human-readable line-by-line format.
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @param {boolean}	options.verbose Whether to output verbose-level messages
 * @return {void}
 */
async function lines(messages, {
	verbose,
	console=defaultConsole
	}={}) {
	const cols = {
		level: {header: '', width: 3},
		rule: {header: 'Rule', width: 7},
		location: {header: 'Location', width: 47},
		description: {header: 'Description'},
	};
	const levels = {
		info: {sorting: 1, icon: '🛈'},
		verbose: {sorting: 1, icon: '💬'},
		error: {sorting: 2, icon: '❌'},
	};
	let sortedMessages = messages.sort((a, b)=>{
		let aLevel = levels[a.level] || {sorting: 0};
		let bLevel = levels[b.level] || {sorting: 0};
		return (aLevel.sorting - bLevel.sorting)
		|| (a.rule||'').localeCompare(b.rule||'');
	});
	console.log(Object.values(cols).map((col)=>col.header.padEnd(col.width||0)).join('\t'));
	for (let message of sortedMessages) {
		if (message.level === 'verbose' && !verbose) {
			continue;
		}
		/* eslint indent: ["error", 4, { "flatTernaryExpressions": true }]*/
		const level = (levels[message.level].icon || message.level.toString())
			.slice(0, cols.level.width)
			.padEnd(cols.level.width, ' ');
		const rule = (message.rule || '')
			.slice(0, cols.rule.width)
			.padEnd(cols.rule.width, '.');
		const location = (message.location || '')
			.replace(/model:|view:|explore:|join:|dimension:|measure:|filter:/g, (match)=>match.slice(0, 1)+':')
			.slice(-cols.location.width)
			.padEnd(cols.location.width, '.');
		const description = message.description || '';
		console.log([level, rule, location, description].join('\t'));
	}
}

module.exports = lines;
