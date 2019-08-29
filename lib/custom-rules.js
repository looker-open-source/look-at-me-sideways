const parser = require('./custom-rule-parser.js')
const jsonpath = require('jsonpath')
const defaultConsole = console

module.exports = function customRule(
	ruleDef = {},
	project,
	{console = defaultConsole} = {}
){
	let messages = []
	let messageDefault = {level: 'error', rule: ruleDef._rule}
	try{
		if(ruleDef.description){messageDefault.description = ruleDef.description}
		if(!ruleDef.expr_rule){throw `Missing expr_rule in manifest/rule:${ruleDef._rule}`}
		let ruleFn
		try{ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`)}
		catch(e){
			console.error(e)
			throw `Invalid expr_rule in manifest/rule:${ruleDef._rule}`
			}	
		let matchDef = ruleDef.match || "$"
		let matches
		try{matches = jsonpath.nodes(project,matchDef)}
		catch(e){throw `Invalid jsonpath in manifest/rule:${ruleDef._rule}/match: ${matchDef}`}
		
		messages.push({
			"level":"info",
			"rule":ruleDef._rule,
			"description":`Rule ${ruleDef._rule} was matched ${matches.length} time(s)`
		})
		
		for(let match of matches ){
			let result = ruleFn(match.value, match.path, project)
			if(result === true) { continue; }
			if(result === false) {messages.push({
				...messageDefault,
				location:formatPath(match.path),
				})}
			else if(typeof result === "string"){messages.push({
				...messageDefault,
				location:formatPath(match.path),
				description:result
				})}
			else{messages = messages.concat(result);}
		}
		return messages
	}
	catch(e){
		return {messages:[{
			...messageDefault,
			location: `manifest/rule:${ruleDef._rule}`,
			path: `/projects/${project.name}/files/manifest.lkml`,
			...(typeof e == 'object' ? e : {description: e} )
		}]}
	}
}

function formatPath(pathArray){
	return pathArray.slice(1).join("/").replace(
		/(model|file|view|join|explore|datagroup|dimension|measure|filter|parameter)\//g,
		match => match.slice(0,-1)+":"
	);
}