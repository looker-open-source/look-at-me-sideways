const defaultConsole = console;
const defaultFs = require('node:fs/promises');
const pathLib = require('path');

/**
 * Read a prior state from a file, output a new state to that file, and return the incremental messages
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @param {boolean}	options.verbose Whether to output verbose-level messages
 * @return {void}
 */
async function addExemptions(messages, {
	cwd = process.cwd(),
	lamsRuleExemptionsPath = "lams-exemptions.ndjson",
	console = defaultConsole,
	fs = defaultFs
	}={}) {

	console.log("BETA: output=add-exemptions and incremental linting are in beta. Feedback welcome in LAMS issue #142.")

	if(!messages.some(m => m.level==="error")){
		//Short circuit cases where no new records would be written
		return
	}

	const centralExemptionsPath = pathLib.resolve(cwd, lamsRuleExemptionsPath)

	// Append error messages into lams-exemptions.ndjson
	let file
	try{
		file = await fs.open(centralExemptionsPath,"a")

		for(let message of messages){
			if(message.level !== "error"){
				//Only need to add exemptions for errors
				continue
			}
			if(!message.rule || !message.location){
				//Only exempt sufficiently specific errors
				continue
			}
			await file.write(
				JSON.stringify({
					rule: message.rule,
					location: message.location,
				})
				+"\n"
			)
		}
	}
	catch(e){
		console.log(e)
	}
	await file?.close()
}

module.exports = addExemptions;
