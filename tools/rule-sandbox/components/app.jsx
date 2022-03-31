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

import React, {useState} from 'react'

import '@fontsource/roboto/400.css'
//import './app.css'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import AppBar from '@mui/material/AppBar'

// "Experimental" Tab API results in much cleaner code
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import AboutPage from './about-page.jsx'
import ProjectPage from './project-page.jsx'
import RulePage from './rule-page.jsx'
import FnDocsPage from './fn-docs-page.jsx'

const App = () => {
	const [tab, 	setTab] = 		useState('project')
	const [project,	setProject] =	useState(undefined)
	const [match,	setMatch] =		useState(undefined)
	const [rule,	setRule] =		useState(undefined)

	return (
		<div className="app">
			<AppBar position="static">
				<h1><a href="https://github.com/looker-open-source/look-at-me-sideways/#look-at-me-sideways-lams" style={{color:'white'}}>LAMS</a> &gt; Rule Sandbox</h1>
				</AppBar>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
					<TabList onChange={changeTab} aria-label="Rule Sandbox tabs">
						<Tab label="About" value="about" />
						<Tab label="Project" value="project" />
						<Tab label="Rule" value="rule" />
						<Tab label="Fn Docs" value="fn-docs" />
						</TabList>
					</Box>
				<TabPanel value="about">
					<AboutPage {...{
						setProject,
						setRule,
						setMatch,
						setTab
						}}/>
					</TabPanel>
				<TabPanel value="project">
					<ProjectPage {...{
						project,
						setTab,
						setProject
						}}/>
					</TabPanel>
				<TabPanel value="rule">
					<RulePage {...{
						project,
						match,
						rule,
						setMatch,
						setRule
						}}/>
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