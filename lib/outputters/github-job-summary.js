const defaultConsole = console;

/**
 * Output info and errors to an environment variable that gets read by .
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @param {boolean}	options.verbose Whether to output verbose-level messages
 * @return {void}
 */
async function githubJobSummary(messages, {
	verbose,
	console=defaultConsole
	}={}) {

	
	const summaryTable = undent2`
		| Rule | Matches | Exemptions | Errors |
		|:-----|:-------:|:----------:|:------:|
		${messages.filter(m => m)
		}
		`

	}

function undent2(strings, ...values){
	const undentLines = (str) =>str
		.split('\n')
		.map(l => l.startsWith('\t\t') ? l.substring(1) : l)
		.join('\n')
	
	let result = undentLines(strings[0])
	
	for (let i = 0; i < values.length; i++) {
		result += values[i]
		result += undentLines(strings[i + 1])
		}
	return result
	}