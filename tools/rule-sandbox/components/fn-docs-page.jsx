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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import {config} from '../../../lib/custom-rule/custom-rule-parser.js'

const fns = config.funcs.map((fn) => ({
	name: fn.name,
	def: fn.fn.toString()
		.replace(/^[^{]*{\s*|\s*}[^}]*$/ig, '')
		.replace(/\/\/[^:]*:/g, '')
		.replace(/\\r|\\n/g, ' ')
		.replace(/\s+/g, ' ')
		.slice(0, 240),
}));

const FnDocsPage = (props) => {
	return (
		<Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
			<TableHead>
				<TableRow>
					<TableCell>Name</TableCell>
					<TableCell>Definition</TableCell>
					</TableRow>
				</TableHead>
			<TableBody>
				{fns.map((fn) => (
					<TableRow
						key={fn.name}
						sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
						>
						<TableCell component="th" scope="row">{fn.name}</TableCell>
						<TableCell><code>{fn.def}</code></TableCell>
						</TableRow>
					))}
			</TableBody>
			</Table>
		)

	}


export default FnDocsPage