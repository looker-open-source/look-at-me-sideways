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

import React, {use, useEffect, useState} from 'react'
import {useDebounce} from 'use-debounce'
import lookmlParser from 'lookml-parser'

import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import Typography from '@mui/material/Typography'

const ProjectPage = (props) => {
	const {
		initProjectFiles,
		setTab,
		setProject
		} = props

	// Core state
	const [projectFiles, setProjectFiles] = useState(initProjectFiles ?? [])
	const [selectedFileContent, setSelectedFileContent] = useState("")
	const [selectedFileIndex, setSelectedFileIndex] = useState(projectFiles.length ? 0 : undefined)
	const [renaming, setRenaming] = useState({index: null, isNew: false, path: ''})
	
	// Derived state
	const [debouncedSelectedFileContent] = useDebounce(selectedFileContent,1000)
	const [projectStatus, setProjectStatus] = useState("")
	const [ctaDisabled, setCtaDisabled] = useState(true)
	
	// Effects
	useEffect(updateSelectedFileContent, [selectedFileIndex, projectFiles])
	useEffect(updateProjectFile, [debouncedSelectedFileContent])
	useEffect(() => {
		parseProject()
	}, [projectFiles])

	return (
		<Stack direction="column" spacing={2} className="project-page">
			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={4}>
				<Typography variant="h6">LookML Project Files</Typography>
				<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
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
			<Stack direction="row" spacing={2} >
				<Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', border: '1px solid #ddd' }}>
					<Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{borderBottom:'1px solid #ddd', padding: '2px'}}>
						<IconButton aria-label="new file" onClick={handleNewFile}><AddIcon /></IconButton>
					</Stack>
					<List sx={{maxHeight: 400, overflowY: 'auto'}}>
						{projectFiles.map((file, f) => (
							<ListItem
								key={f}
								disablePadding
								secondaryAction={renaming.index !== f && (
									<Stack direction="row">
										<IconButton edge="end" aria-label="rename" onClick={() => handleRenameFile(f)}>
											<EditIcon />
										</IconButton>
										<IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFile(f)}>
											<DeleteIcon />
										</IconButton>
									</Stack>
								)}
							>
								{renaming.index === f ? (
									<TextField
										value={renaming.path}
										onChange={handleRenameInputChange}
										onBlur={handleRenameConfirm}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleRenameConfirm();
											if (e.key === 'Escape') handleRenameCancel();
										}}
										size="small"
										sx={{ margin: '4px 16px', width: 'calc(100% - 32px)' }}
										autoFocus
									/>
								) : (
									<ListItemButton selected={f === selectedFileIndex} onClick={() => handleFileSelect(f)}>
										<ListItemText
											primary={file.path}
											primaryTypographyProps={{
												style: {
													whiteSpace: 'nowrap',
													overflow: 'hidden',
													textOverflow: 'ellipsis'
											}}}
										/>
									</ListItemButton>
								)}
							</ListItem>
						))}
						{renaming.isNew && renaming.index === projectFiles.length && (
							<ListItem key="renaming-new-file" disablePadding>
								{/* This space is intentionally left blank for the new file text field to appear */}
							</ListItem>
						)}
						</List>
					</Box>
				<TextField 
					id='project-text-field'
					label={selectedFileIndex !== undefined ? `Editing: ${projectFiles[selectedFileIndex]?.path}`: "Select a file to edit"}
					placeholder='LookML content of the file'
					multiline
					rows={16}
					style={{width:"100%"}}
					value={selectedFileContent}
					onChange={handleFileContentsChange}
					disabled={selectedFileIndex === undefined}
					></TextField>
				</Stack>
			</Stack>
		)

	function handleFileSelect(index) {
		setSelectedFileIndex(index)
	}

	function handleFileContentsChange(event) {
		setSelectedFileContent(event.target.value)
	}

	function handleRenameInputChange(event) {
		setRenaming(r => ({...r, path: event.target.value}))
	}

	function handleRenameConfirm() {
		const { index, path, isNew } = renaming;
		if (!path) {
			handleRenameCancel();
			return;
		}
		// Check if path (other than the original) already exists
		if (projectFiles.some((file, i) => file.path === path && i !== index)) {
			alert("File path already exists or is invalid.");
			return;
		}
	
		const newFiles = [...projectFiles];
		newFiles[index] = { ...newFiles[index], path: path };
		setProjectFiles(newFiles);
		if (isNew) {
			setSelectedFileIndex(index);
		}
		setRenaming({index: null, isNew: false, path: ''});
	}

	function handleRenameCancel() {
		if (renaming.isNew) {
			setProjectFiles(files => files.slice(0, -1));
		} 
		setRenaming({index: null, isNew: false, path: ''});
	}

	function handleNewFile() {
		// Add a temporary placeholder file and enter renaming mode for it
		const newIndex = projectFiles.length;
		setProjectFiles([...projectFiles, {path: '', contents: ''}]);
		setRenaming({index: newIndex, isNew: true, path: 'new_file.view.lkml'});
	}

	function handleRenameFile(index) {
		setRenaming({index: index, isNew: false, path: projectFiles[index].path});
	}

	function handleDeleteFile(index) {
		// If we are deleting the file currently being edited, cancel the edit first.
		if (renaming.index === index) {
			handleRenameCancel();
		}

		if (window.confirm(`Are you sure you want to delete ${projectFiles[index].path}?`)) {
			const newFiles = projectFiles.filter((_, i) => i !== index);
			setProjectFiles(newFiles);
			if (selectedFileIndex === index) {
				setSelectedFileIndex(newFiles.length > 0 ? 0 : undefined);
			} else if (selectedFileIndex > index) {
				setSelectedFileIndex(i => i - 1);
			}
		}
	}

	function updateSelectedFileContent() {
		if (selectedFileIndex !== undefined && projectFiles[selectedFileIndex]) {
			setSelectedFileContent(projectFiles[selectedFileIndex].contents);
		} else {
			setSelectedFileContent("");
		}
	}

	function updateProjectFile() {
		if (selectedFileIndex === undefined) return;
		const currentFile = projectFiles[selectedFileIndex];
		if (!currentFile || currentFile.contents === debouncedSelectedFileContent) return;

		const newFiles = [...projectFiles];
		newFiles[selectedFileIndex] = { ...currentFile, contents: debouncedSelectedFileContent };
		setProjectFiles(newFiles);
	}

	async function parseProject() {
		if (!projectFiles || projectFiles.length === 0) {
			setProjectStatus("No files in project")
			setProject(undefined)
			setCtaDisabled(true)
			return
		}
		try {
			setProjectStatus("Parsing LookML...")
			const parsedProject = await lookmlParser.parseFiles({source: projectFiles})
			// CONTINUE HERE ^ Need to go update LookML parser to work better in browser environments
			//                 - Make sure that references to glob are conditional/isolated.
			//                 - Don't rely on fs/path to load PEG code, use import/require insteat 
			setProject(parsedProject)
			setProjectStatus("✅ Project ready")
			setCtaDisabled(false)
		} catch (e) {
			setProjectStatus(`❌ Invalid LookML. ${trunc(e,120)}`)
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