const deepGet = require('../deep-get.js')
const pathForLocation = require('../message/path-for-location.js')
const {Message} = require('../message/message.js')

const defaultConsole = console;
const defaultFs = require('node:fs/promises')

const MAX_MESSAGES_PER_RULE = 15
const MAX_MISC_MESSAGES = 50
const FAIL_LABEL = "❌ Fail"
const PASS_LABEL = "✅ Pass"

const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL ?? 'GITHUB_SERVER_URL'
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? 'GITHUB_REPOSITORY'
const GITHUB_SHA = process.env.GITHUB_SHA ?? 'GITHUB_SHA'
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY

module.exports = githubJobSummary

/**
 * Output info and errors to a markdown file that gets read by GitHub Job Summaries.
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @return {void}
 */

async function githubJobSummary(messages, {
	verbose,
	console=defaultConsole,
	fs=defaultConsole,
	project
	}={}) {
	const {positions} = project

	const messagesByRule = {}
	for(let msg of messages){
		let rule = msg.rule || "No Rule"
		messagesByRule[rule] ??= {errors:[], others:[]}
		let summaryMatch
		if(msg.level === Message.levels.error){
			messagesByRule[rule].errors.push(msg)
			}
		else if (summaryMatch = msg.description?.match(/^Rule (.+?) summary: (\d+) matches, (\d+) matches exempt, and (\d+) errors$/)){
			// ^ Later, should restructure messages to contain flexible data values rather than looking for these strings
			let [,rule,matches,exempt,errors] = summaryMatch
			messagesByRule[rule].summary = {rule,matches,exempt,errors,status:parseInt(errors)>0 ? FAIL_LABEL : PASS_LABEL}
			}
		else if (msg.level === Message.levels.verbose){
			if(verbose){
				messagesByRule[rule].others.push(msg)
				}
			} 
		else {
			messagesByRule[rule].others.push(msg)
			}
		}
	
	for(let [rule,ruleMessages] of Object.entries(messagesByRule)){
		if(ruleMessages.errors.length && !ruleMessages.summary){
			ruleMessages.summary = {rule,matches: "N/A", exempt:"N/A", errors:ruleMessages.errors.length.toString(), status: FAIL_LABEL}
			}
		}

	const summaryTable = undent2`
		| Rule | Status | Matches | Exemptions | Errors |
		|:-----|:------:|:-------:|:----------:|:------:|
		${Object.values(messagesByRule)
			.map(msg => msg.summary)
			.filter(Boolean)
			.sort((a,b)=> a.status.localeCompare(b.status) || a.rule.localeCompare(b.rule))
			.map(s =>
				`| [${s.rule}](#${s.rule}) | ${s.status} |${s.matches} | ${s.exempt} | ${s.errors} |`)
			.join("\n")
			}
		`
	const misc = []

	const ruleOutput = []
	for(let [rule,ruleMessages] of Object.entries(messagesByRule).sort((a,b)=>a[0].localeCompare(b[0]))){
		if(!ruleMessages.errors.length){
			// For rules with no errors, send all info into misc bucket and skip the section
			if(ruleMessages.others.length){misc.push(...ruleMessages.others)}
			continue
			}
		let globalDescription = project?.manifest?.rule?.[rule]?.description
		ruleOutput.push(undent2`
		## ${rule}

		${globalDescription || ""}

		${ruleMessages.errors
			//.sort(?) //Sort by location maybe?
			.slice(0,MAX_MESSAGES_PER_RULE)
			.map(bulletPointMessage({globalDescription,project}))
			.join("\n")
			+(ruleMessages.errors.length > MAX_MESSAGES_PER_RULE 
				? `\n* +${ruleMessages.errors.length - MAX_MESSAGES_PER_RULE} more`
				: "")
			}
		
		${ruleMessages.others.length ? 
			`<details><summary><b>Info (${ruleMessages.others.length})</b></summary>\n\n`
			+ ruleMessages.others
				.map(bulletPointMessage({globalDescription,project}))
				.join("\n")
			+ "\n\n</details>\n"
			: ""
			}
		`)
		}

	const miscOutput = misc.length
		? `## More info\n\n<details><summary><b>Expand/collpase - ${misc.length} messages</b></summary>\n\n`
		+ misc
			.slice(0,MAX_MISC_MESSAGES)
			.sort((a,b) => (a.rule || "").localeCompare(b.rule || ""))
			.map(bulletPointMessage({globalDescription:"",project}))
			.join("\n")
		+ "\n\n</details>\n"
		: ""

	const finalOutput = (
		summaryTable +"\n"
		+ ruleOutput.join("\n\n")+"\n"
		+ miscOutput +"\n"
		).replace(/\n\n\n+/g,"\n\n")


	if(finalOutput.length >= 50*1024*1024){
		console.warn("GitHub Step Summary output exceeds documented limit of 50Mb")
		}
	
	if(GITHUB_STEP_SUMMARY){
		await fs.writeFile(GITHUB_STEP_SUMMARY, finalOutput)
		}
	else {
		console.warn("Missing environment variable `GITHUB_STEP_SUMMARY`. Markdown output will instead be output to stdout")
		console.log(finalOutput)	
		}
	

	}

function bulletPointMessage({globalDescription,project}){
	return function(message){
		const locationLabel = message.location ?? 'Location unknown'
		const locationPath = message.location && pathForLocation(message.location)
		const position = message.location && deepGet(project?.positions, locationPath)?.$p
		const locationRoot = locationPath?.[0]
		let filePath, filePosition
		if(locationRoot === 'file'){
			filePath = locationPath[1]
			filePosition = position
			}
		if(locationRoot === 'model'){
			const model = project.model[locationPath[1]]
			filePath = position && model?.$file_path?.[position[0]]
			filePosition = position.slice(1)
			}
		// Later, maybe handle this case, but add logic to determine 
		// where the manifest declaration was loaded from
		// if(locationRoot === 'manifest'){}

		const sl = filePosition?.[0]
		const el = filePosition?.[2]
		const L = sl === 
			undefined ? ""
			: locationPath[locationPath.length-2] === "file" ? "" //Skip lines if the location is an entire file
			: "#L"+ (1+sl) + "-L" + (1+el) 

		const linkedLocation = position
			? `[${locationLabel}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/blob/${GITHUB_SHA}/${filePath}${L})`
			: locationLabel
		const maybeDescription = message.description && message.description !== globalDescription
			? " - " + message.description.replace(/\n/g, "\n   ")
			: ""
		return `* **${linkedLocation}**${maybeDescription}`
		}
	}

function undent2(strings, ...values){
	const undentLines = (str) =>str
		.split('\n')
		.map(l => l.startsWith('\t\t') ? l.substring(2) : l)
		.join('\n')
	
	let result = undentLines(strings[0])
	
	for (let i = 0; i < values.length; i++) {
		result += values[i]
		result += undentLines(strings[i + 1])
		}
	return result
	}
