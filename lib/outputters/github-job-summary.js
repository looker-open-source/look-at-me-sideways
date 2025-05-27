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
			.map(msg => msg?.description?.match(/^Rule (.?) summary: (\d+) matches, (\d+) matches exempt, and (\d+) errors$/))
			// ^ TODO: Should restructure messages to contain flexible data values rather than looking for these strings
			.filter(Boolean)
			.map(([,rule,matches,exempt,errors]) => ({rule,matches,exempt,errors,status:parseInt(errors)>0 ? '❌ Fail' : "✅ Pass"}))
			.sort((a,b)=> a.status.localeCompare(b.status) || a.rule.localeCompare(b.rule))
			.map(s =>
				`| [${s.rule}](#${s.rule}) | ${s.status} |${s.matches} | ${s.exempt} | ${s.errors} |`)
			.join("\n")
			}
		`
	
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
	
	const ruleOutput = []
	for(let [rule,ruleMessages] of Object.entries(messagesByRule).sort((a,b)=>a[0].localeCompare(b[0]))){
		let globalDescription = project?.manifest?.rule?.[rule]?.description
		ruleOutput.push(undent2`
		## ${rule}

		${globalDescription || ""}

		${ruleMessages.errors
			//.sort(?) //Sort by location maybe?
			.slice(0,MAX_MESSAGES_PER_RULE)
			.map(bulletPointMessage({globalDescription,positions}))
			.join("\n")
			+(ruleMessages.errors.length > MAX_MESSAGES_PER_RULE 
				? `\n* +${ruleMessages.errors.length - MAX_MESSAGES_PER_RULE} more`
				: "")
			}
		
		${ruleMessages.others.length ? 
			`<details><summary><b>Info (${ruleMessages.others.length})</b></summary>\n`
			+ ruleMessages.others
				.map(bulletPointMessage({globalDescription}))
				.join("\n")
			+ "\n</details>\n"
			: ""
		}

		`.replace(/\n\n\n+/g,"\n\n"))
		}

	console.log(summaryTable + ruleOutput.join("\n\n")+"\n")
	}

function bulletPointMessage({globalDescription,positions}){
	return function(message){
		const locationLabel = message.location ?? 'Location unknown'
		const position = message.location //CONTINUE HERE
			?? deepGet(positions,message.location)?.$p
		
		const locationPosition = position
			? `[${locationLabel}] ${position}`
			: locationLabel
		const maybeDescription = message.description && message.description !== globalDescription
			? " - " + message.description
			: ""
		return `* **${locationPosition}**${maybeDescription}`
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
