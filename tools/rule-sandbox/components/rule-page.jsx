import React, {useState, useEffect} from 'react'
import {useDebounce} from 'use-debounce'

import {DataGrid} from '@mui/x-data-grid'
import {
	Box,
	Button,
	Stack,
	TextField
	} from '@mui/material'

import * as customRule from '../../../lib/custom-rules.js'

const columns = [
	{width: 200, field:"path",headerName:"Path"},
	{width: 400, field:"matchValue", headerName:"Match Value"},
	{width: 250, field:"ruleResult", headerName:"Rule Result"},
	{width: 250, field:"cursorResult", headerName:"Result at Cursor", description:"The result of evaluating the rule within the subtree where the text cursos is currently located"}
	]

const RulePage = (props) => {
	const {
		setTab,
		project
		} = props

	// Core state
	const [ruleText, setRuleText] = useState("")
	const [matchText, setMatchText] = useState("")
	
	// Derived state
	const [dRuleText] = useDebounce(ruleText,1000)
	const [dMatchText] = useDebounce(matchText,1000)
	const [rows, setRows] = useState(
		[{ id: 1, path: '$.', matchValue: '{...}', ruleResult: "true", cursorResult: "true" }],
		)
	
	// Effects
	useEffect(evaluate,[dRuleText, dMatchText])

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
			<DataGrid
				columns={columns}
				rows={rows}
				autoHeight
				pagination
				pageSize={10}
				/>
			</Stack>
		)

	function changeMatchText(event){setMatchText(event.target.value)}
	function changeRuleText (event){setRuleText (event.target.value)}

	function evaluate(event){
		console.log("Evaluating...")
		if(project===undefined){
			console.error("TODO: Project not ready")
			}
		let ruleDef = {
			match: matchText,
			expr_rule: ruleText
			}
		let ruleResult, ruleError
		try{ ruleResult = customRule(ruleDef,project) }
		catch(e){ console.log({e}); ruleError = e && e.message || e }
		if(ruleError){
			console.error(`TODO: Rule error handling: ${ruleError}`)
			if(ruleError.match(/Invalid jsonpath/)){
				
				}
			if(ruleError.match(/Invalid expr_rule/)){
			
				}	
			}
		console.log({ruleResult})
		}
	}


export default RulePage