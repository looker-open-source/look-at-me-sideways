import React, {useState, useEffect} from 'react'
import {useDebounce} from 'use-debounce'

import {DataGrid} from '@mui/x-data-grid'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import * as ruleMatchEvaluator from '../../../lib/custom-rule/rule-match-evaluator.js'
import * as getProjectJsonpathMatches from '../../../lib/custom-rule/get-project-jsonpath-matches.js'

const columns = [
	{width: 250, field:"path",headerName:"Path"},
	{width: 500, field:"matchValue", headerName:"Match Value"},
	{width: 500, field:"ruleResult", headerName:"Rule Result", cellClassName:cell=>cell.row.resultClass},
	]
const nil = []

const RulePage = ({
	project,
	match,
	rule,
	setMatch,
	setRule
	}) => {
	
	// Core state
	const [ruleText,	setRuleText] = 	useState(rule || '')
	const [matchText,	setMatchText] = useState(match || '')
	
	// Derived state
	const [dRuleText] = useDebounce(ruleText,1000)
	const [dMatchText] = useDebounce(matchText,1000)
	const [rows, setRows] = useState([
		//{ id: 1, path: '$.', matchValue: '{...}', ruleResult: "true", cursorResult: "true" },
	])
	const [status,setStatus] = useState("")
	
	// Effects
	useEffect(evaluate,[project, dRuleText, dMatchText])
	useEffect(updateMatch,[matchText])
	useEffect(updateRule, [ruleText])

	return (
		<Stack direction="column" spacing={4} className="rule-page">
			<TextField 
				label='Match'
				placeholder='JsonPath to match'
				style={{width:"100%", minWidth:"20em"}}
				value={matchText}
				onChange={changeMatchText}
				></TextField>
			<TextField 
				label='Rule Expression'
				placeholder='Liyad expression that defines the logic of the rule'
				multiline
				rows={8}
				style={{width:"100%", minWidth:"20em"}}
				value={ruleText}
				onChange={changeRuleText}
				></TextField>
			<Typography align="center">{status}</Typography>
			<Box sx={{
				'& .error': {color: 'red'},
				'& .fail': {color: 'darkred'},
				'& .pass': {color: 'darkgreen'}
				}}>
				{rows.length>0 && 
					<DataGrid
						columns={columns}
						rows={rows}
						autoHeight
						pagination
						pageSize={10}
						/>}
				</Box>
			</Stack>
		)

	function changeMatchText(event){setMatchText(event.target.value)}
	function changeRuleText (event){setRuleText (event.target.value)}
	function updateMatch(){setMatch(matchText)}
	function updateRule (){setRule(ruleText)}

	function evaluate(event){
		setRows(nil) // React: Is it ok to pre-emptively "clear" state that may be immediately re-set, or can it thrash the app?
		if(project===undefined){
			return setStatus(`Project not ready. Please review Project tab first.`)
			}
		const uncommentedRule = dRuleText.replace(/\n\s*#/g," ")
		let ruleDef = {
			$name: 'sandbox_rule',
			match: dMatchText,
			expr_rule: uncommentedRule
			}
		try{
			if(!ruleDef.match){
				return setStatus(`Please provide a "Match" (JSONPath)`)
				}
			if(!ruleDef.expr_rule){
				return setStatus(`Please provide a "Rule Expression" (Liyad expression)`)
				}
			
			let matches = getProjectJsonpathMatches(project,ruleDef)
			
			if(!matches.length){
				return setStatus(`No matches found for the provided Match expression`)
				}
			
			let rule
			try{
				rule = ruleMatchEvaluator(ruleDef,project)
				}
			catch(e){
				let ruleError = e && e.message || e;
				return setStatus('❌ '+ruleError)
				}

			let results = matches.map(match=>{
				try{return rule(match)}
				catch(e){return {match,error:e}}
				})
			let newRows = results.map((result,r)=>({
				id: r,
				path: result.match.path,
				matchValue: JSON.stringify(result.match.value,undefined, 4),
				ruleResult: result.error ? result.error.message : JSON.stringify(result.value, undefined, 4),
				resultClass: result.error ? 'error'
					 : result.value === true ? 'pass'
					 : result.value === false ? 'fail'
					 : typeof result.value == 'string' ? 'fail'
					 : ''
				}))
			setStatus("")
			setRows(newRows)
			}
		catch(e){
			console.error(e);
			let ruleError = e && e.message || e;
			setStatus('❌ '+ruleError)
			}
		}
	}

export default RulePage