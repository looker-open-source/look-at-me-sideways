const defaultConsole = console;

/**
 * Output info and errors to an environment variable that gets read by .
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @param {boolean}	options.verbose Whether to output verbose-level messages
 * @return {void}
 */

const MAX_MESSAGES_PER_RULE = 25
const deepGet = require('../deep-get.js')
const pathForLocation = require('../message/path-for-location.js')

const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL ?? 'GITHUB_SERVER_URL'
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? 'GITHUB_REPOSITORY'
const GITHUB_SHA = process.env.GITHUB_SHA ?? 'GITHUB_SHA'

module.exports = githubJobSummary

async function githubJobSummary(messages, {
	verbose,
	console=defaultConsole,
	project
	}={}) {
	const {positions} = project
	const summaryTable = undent2`
		| Rule | Status | Matches | Exemptions | Errors |
		|:-----|:------:|:-------:|:----------:|:------:|
		${messages
			.map(msg => msg?.description?.match(/^Rule (.+?) summary: (\d+) matches, (\d+) matches exempt, and (\d+) errors$/))
			// ^ TODO: Should restructure messages to contain flexible data values rather than looking for these strings
			.filter(Boolean)
			.map(([,rule,matches,exempt,errors]) => ({rule,matches,exempt,errors,status:parseInt(errors)>0 ? '❌ Fail' : "✅ Pass"}))
			.sort((a,b)=> a.status.localeCompare(b.status) || a.rule.localeCompare(b.rule))
			.map(s =>
				`| [${s.rule}](#${s.rule}) | ${s.status} |${s.matches} | ${s.exempt} | ${s.errors} |`)
			.join("\n")
			}
		`
	//TODO: Add in partial summaries for errors for which there were no provided summaries, e.g. parser errors
	
	const messagesByRule = {}
	for(let msg of messages){
		let rule = msg.rule || "No Rule"
		messagesByRule[rule] ??= {errors:[], others:[]}
		if(msg.level === "error"){
			messagesByRule[rule].errors.push(msg)
			} else {
			messagesByRule[rule].others.push(msg)
			}
		}
	const misc = []

	const ruleOutput = []
	for(let [rule,ruleMessages] of Object.entries(messagesByRule).sort((a,b)=>a[0].localeCompare(b[0]))){
		if(!ruleMessages.errors.length){
			// For rules with no errors, send all info into misc bucket and skip the section
			if(ruleMessages.others.length){misc.push(...ruleMessages.others)}
			continue
			}
		let globalDescription = project?.manifest?.rule?.[rule]?.description
		//TODO ^ Built-in rules' descriptions are not found in the manifest. 
		ruleOutput.push(undent2`
		## ${rule}

		${globalDescription || ""}

		${ruleMessages.errors.map(m=>JSON.stringify(m)).join("\n")}

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
			`<details><summary><b>Info (${ruleMessages.others.length})</b></summary>\n`
			+ ruleMessages.others
				.map(bulletPointMessage({globalDescription,project}))
				.join("\n")
			+ "\n</details>\n"
			: ""
		}

		`.replace(/\n\n\n+/g,"\n\n"))
		}

	const miscOutput = `<details><summary><b>Additional Info (${misc.length})</b></summary>\n`
		+ misc
			.map(msg => '`'+JSON.stringify(msg)+'`')
			//TODO ^ format this
			//TODO limit this
			.join("\n")
		+ "\n</details>\n"

	console.log(
		summaryTable +"\n"
		+ ruleOutput.join("\n\n")+"\n"
		+ miscOutput +"\n"
		)
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
		// where the manifest declaration was loaded from :
		// if(locationRoot === 'manifest'){}

		const sl = filePosition?.[0]
		const el = filePosition?.[2]
		const L = sl === undefined ? "" : "#L"+ (1+sl) + "-L" + (1+el) 

		const linkedLocation = position
			? `[${locationLabel}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/blob/${GITHUB_SHA}/${filePath}${L})`
			: locationLabel
		const maybeDescription = message.description && message.description !== globalDescription
			? " - " + message.description
			: ""
		return (`* **${linkedLocation}**${maybeDescription}`
			   +`\n  ${JSON.stringify({locationLabel, locationPath,position, filePath, filePosition})}`
				)
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
