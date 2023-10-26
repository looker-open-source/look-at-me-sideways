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

import React from 'react'

import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const AboutPage = ({setProject,setRule,setMatch,setTab}) => {
	return (
		<Stack direction="column" spacing={3}>
			<Typography align="center" style={{fontSize:"1.75em", color:"#888"}}>
				Rule Sandbox is a light-weight UI to help test <a style={{color:"#777"}} href="https://looker-open-source.github.io/look-at-me-sideways/customizing-lams.html">custom rules</a> for
				use with the <a style={{color:"#777"}} href="https://github.com/looker-open-source/look-at-me-sideways/#look-at-me-sideways-lams">Look At Me Sideways (LAMS) LookML Linter</a>
				</Typography>
			<Typography align="center">Want to try the app with some sample data?</Typography>
			<Stack direction="row" justifyContent="center" alignItems="center">
				<Button
					variant="contained"
					onClick={loadSample}
					>See Sample</Button>
				</Stack>
			<Typography variant="h4">Project</Typography>	
			<Typography>
					To get started, you will need to provide a LookML project to lint against, under the project tab.
					To avoid having to abstract and display a view of multiple files, the app instead accepts a JSON representation of your entire project, as output by
					node-lookml-parser, rather than the raw LookML. So, you will want to run the parser on your project from the command line.
				</Typography>
			<Typography>For LAMS v3+ users:</Typography>	
			<code style={{whiteSpace:'pre-line'}}>
			{`npm install -g lookml-parser
				cd ~/your/project
				lookml-parser --file-output=by-name --whitespace=4 --transform=x
				# or --transform=xs if you wish to ignore/drop $strings data`}
				</code>
			<Typography>For LAMS v2 users:</Typography>	
			<code style={{whiteSpace:'pre-line'}}>
			{`npm install -g lookml-parser
				cd ~/your/project
				lookml-parser --file-output=array --whitespace=4`}
				</code>
			<Typography>
				Depending on your operating system, you may find it convenient to pipe the output of the parser directly to your clipboard
				</Typography>
			<Typography variant="h4">Rule</Typography>
			<Typography>
				In the rule tab, enter the match JSON Path and Liyad rule expression as you would
				within your <a href="https://looker-open-source.github.io/look-at-me-sideways/customizing-lams.html">custom rule</a>
				</Typography>
			</Stack>
		)

	function loadSample(){
		setMatch("$.model.*.explore.*")
		setRule("(!== ::match:description undefined)")
		setProject({
			model:{
				sample_model:{
					explore:{
						good_explore:{
							description: "All explores should have descriptions, shouldn't they?"
							},
						bad_explore: {}
						}
					}
				}
			})
		setTab("project")
		}
	}


export default AboutPage