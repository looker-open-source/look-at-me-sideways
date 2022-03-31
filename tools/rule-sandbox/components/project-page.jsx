/*

 MIT License

 Copyright (c) 2022 Google LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import React, {useEffect, useState} from 'react'
import {useDebounce} from 'use-debounce'

import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const ProjectPage = (props) => {
	const {
		project,
		setTab,
		setProject
		} = props

	// Core state
	const [projectText, setProjectText] = useState(project ? JSON.stringify(project, undefined, 4) : "")
	
	// Derived state
	const [debouncedProjectText] = useDebounce(projectText,1000)
	const [ctaDisabled, setCtaDisabled] = useState(true)
	const [projectStatus, setProjectStatus] = useState("")
	
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
				<Typography>{projectStatus}</Typography>
				<Button 
					variant="contained"
					onClick={()=>setTab("rule")}
					value="rule"
					disabled={ctaDisabled}>
					Inspect Rule(s)
					</Button>
				</Stack>
			</Stack>
		)

	function changeProjectText(event){setProjectText(event.target.value)}
	function parseProject(){
		if(projectText === ""){
			setProjectStatus("Provide Project JSON")
			setProject(undefined)
			setCtaDisabled(true)
			return
			}
		try{
			const project = JSON.parse(projectText)
			setProjectStatus("✅ Project ready")
			setProject(project)
			setCtaDisabled(false)
			}
		catch(e){
			setProjectStatus(`❌ Invalid JSON. ${trunc(e,120)}`)
			setProject(undefined)
			setCtaDisabled(true)
			}
		}
	}

function trunc(message, maxLength){
	message = message.toString()
	return message.length <= maxLength ? message : message.slice(0,maxLength)+'...'
	}

export default ProjectPage