const defaultConsole = console;
const defaultFs = require('node:fs/promises');
const readline = require('node:readline/promises');
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
	verbose = false,
	cwd = process.cwd(),
	incrementalPath,
	console = defaultConsole,
	fs = defaultFs
	}={}) {

	if(!messages.some(m => m.level==="error")){
		//Short circuit cases where no new records would be written
		return
	}

	const centralExemptionsPath = pathLib.resolve(cwd, incrementalPath || "lams-exemptions.ndjson")

	// Append error messages into lams-exemptions.ndjson
	let file
	try{
		file = await fs.open(centralExemptionsPath,"a")
		
		// Add an additional line break to the start of the batch
		// This can defend against someone accidentally saving the file without a terminating line break
		// And it can also help users identify batches from distinct runs
		// Per the ndjson spec, and per our own implementation, any empty lines will simply be ignored
		await file.write("\n")

		for(let message of messages){
			if(message.level !== "error"){
				//Only need to add exemptions for errors
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
