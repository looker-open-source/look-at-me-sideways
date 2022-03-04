import React, {useEffect, useState} from 'react'
import {useDebounce} from 'use-debounce'

import {
	Box,
	Button,
	Stack,
	TextField
	} from '@mui/material'

const ProjectPage = (props) => {
	const {
		setTab,
		setProject
		} = props

	// Core state
	const [projectText, setProjectText] = useState("")
	
	// Derived state
	const [debouncedProjectText] = useDebounce(projectText,1000)
	const [matchMessage, setMatchMessage] = useState("...")
	
	// Effects
	useEffect(parseProject,[debouncedProjectText])

	return (
		<Stack direction="column" spacing={4} className="project-page">
			<TextField 
				id='project-text-field'
				label='Project JSON'
				placeholder='JSON representation of LookML project contents, as per output of node-lookml-parser (file-output=array)'
				multiline
				maxRows={24}
				style={{width:"100%", minWidth:"20em"}}
				value={projectText}
				onChange={changeProjectText}
				></TextField>
			<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={4}>
				<Box>{matchMessage}</Box>
				<Button 
					variant="contained"
					onClick={()=>setTab("rule")}
					value="rule">
					Inspect Rule(s)
					</Button>
				</Stack>
			</Stack>
		)

	function changeProjectText(event){setProjectText(event.target.value)}
	function parseProject(){
		try{
			const project = JSON.parse(projectText)
			setProject(project)
			}
		catch(e){
			console.error("TODO: Invalid JSON message")
			setProject(undefined)
			}
		}

	}


export default ProjectPage