const defaultFs = require("node:fs")
const readline = require('node:readline');
// ^'node:readline/promises' allows for a more readable implementation, but switched to this for greater Node compatibility (Node v<=16)
// Ref: https://github.com/looker-open-source/look-at-me-sideways/commit/c2de372fbe76423ae35021d2c9aab6cff935e43f#diff-252e9ae9caf9f8cba76b8c29fcb25c84338a43588134da9cdc6d6766b2d2d7b2
const { once } = require('node:events');
const pathLib = require("path");

const defaultLamsRuleExemptionsPath = "lams-exemptions.ndjson"
const location = "file:lams-exemptions.ndjson"

module.exports = async function loadLamsExcemptions({
	fs = defaultFs,
	cwd = process.cwd(),
	lamsRuleExemptionsPath = defaultLamsRuleExemptionsPath
}){
	const messages = []
	const centralExemptions = new Set()
	const routeException = exceptionRouter(lamsRuleExemptionsPath)
	let fileHandle
	try {
		const resolvedLamsRuleExemptionsPath = pathLib.resolve(cwd, lamsRuleExemptionsPath)
		fileHandle = await new Promise((res,rej)=>fs.open(resolvedLamsRuleExemptionsPath,(err,fd)=>err?rej(err):res(fd)))
		const fileStream = fs.createReadStream(undefined,{fd:fileHandle})
		fileStream.on('error',e=>routeException(e,messages))
		//await once(fileStream, 'open') // When passing in a fileHandle, it is already open, so there is no open event
		const lines = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		})
		let l=0
		lines.on("line",(line) => {
			l++;
			if(line === ""){return}
			const data = tryJsonParse(line)
			const dataInvalid = validateData(data)
			if(dataInvalid){
				messages.push({level:"error",location,description:`${dataInvalid} (line ${l})`})
				return
			}
			centralExemptions.add(
				data.rule + " "+ data.location
			)
		})
		.on('error',e=>routeException(e,messages))
		await once(lines, 'close');

		if(centralExemptions.size>0){
			console.log("BETA: lams-exemptions.ndjson and incremental linting are in beta. Feedback welcome in LAMS issue #142.")
		}
	}
	catch(e){routeException(e,messages)}
	try{fileHandle.close()}catch(e){}
	return {
		messages,
		centralExemptions
	}
}

function exceptionRouter(lamsRuleExemptionsPath){
	return function routeException(e,messages){
		if(e.code === "ENOENT"){
			messages.push({
				location,
				level: lamsRuleExemptionsPath === defaultLamsRuleExemptionsPath ? "verbose" : "error",
				description: `No central LAMS exemptions found. ${e.message}`
			})
		}
		else{
			messages.push({
				location, level: "error",
				description: `Unexpected error loading central LAMS exemptions. ${e.message}`
			})
		}
	}
}

function validateData(data){
	if(!data){return `Invalid JSON`}
	if(!data.rule){return 'Missing required `rule`'}
	if(!data.location){return 'Missing required `location`'}
	if(data.rule.match(" ")){return 'Rule name contains an illegal space'}
	if(data.location.match(" ")){return 'Location contains an illegal space'}
}

function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
}