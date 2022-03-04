import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/app.jsx'

document.addEventListener('DOMContentLoaded',()=>{
	const root = document.createElement('div')
	root.setAttribute("id","react-app-root")
	document.body.appendChild(root)

	ReactDOM.render(<App />, root)
	})