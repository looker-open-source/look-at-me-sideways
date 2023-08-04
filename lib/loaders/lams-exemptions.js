const defaultFs = require("node:fs")
const readline = require('node:readline/promises');
const pathLib = require("path")
const defaultLamsRuleExemptionsPath = "lams-exemptions.ndjson"
const location = "file:lams-exemptions.ndjson"

module.exports = async function loadLamsExcemptions({
	fs = defaultFs,
	cwd = process.cwd(),
	lamsRuleExemptionsPath = defaultLamsRuleExemptionsPath
}){
	const messages = []
	const centralExemptions = new Set()
	try {
		const resolvedLamsRuleExemptionsPath = pathLib.resolve(cwd, lamsRuleExemptionsPath)
		const fileStream = fs.createReadStream(resolvedLamsRuleExemptionsPath)
		const lines = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		})

		let l=0
		for await (const line of lines) {
			l++;
			if(line === ""){continue}
			const data = tryJsonParse(line)
			const dataInvalid = validateData(data)
			if(dataInvalid){
				messages.push({level:"error",location,description:`${dataInvalid} (line ${l})`})
				continue
			}
			centralExemptions.add(
				data.rule + " "+ data.location
			)
		}

		if(centralExemptions.size>0){
			console.log("BETA: lams-exemptions.ndjson and incremental linting are in beta. Feedback welcome in LAMS issue #142.")
		}

		return {
			messages,
			centralExemptions
		}
	}
	catch(e){
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
		return {
			messages,
			centralExemptions
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