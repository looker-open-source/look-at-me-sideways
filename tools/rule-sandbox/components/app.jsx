import React, {useState} from 'react'

import '@fontsource/roboto/400.css'
//import './app.css'

import {
	Box,
	Tab,
	AppBar
	} from '@mui/material'
import {
	TabContext,
	TabList,
	TabPanel
	} from '@mui/lab';

import ProjectPage from './project-page.jsx'
import RulePage from './rule-page.jsx'
import FnDocsPage from './fn-docs-page.jsx'



const App = () => {
	const [tab, setTab] = useState('project')
	const [project, setProject] = useState(undefined)

	return (
		<div className="app">
			<AppBar position="static">
				<h1>LAMS Rule sandbox</h1>
				</AppBar>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
					<TabList onChange={changeTab} aria-label="Rule Sandbox tabs">
						<Tab label="Project" value="project" />
						<Tab label="Rule" value="rule" />
						<Tab label="Fn Docs" value="fn-docs" />
						</TabList>
					</Box>
				<TabPanel value="project">
					<ProjectPage
						setTab = {setTab}
						setProject = {setProject}
						/>
					</TabPanel>
				<TabPanel value="rule">
					<RulePage 
						project = {project}
						/>
					</TabPanel>
				<TabPanel value="fn-docs">
					<FnDocsPage />
					</TabPanel>
				</TabContext>
			</div>
		)

	function changeTab(event, newValue){setTab(newValue)}
	}

export {App}
export default App