/* Copyright (c) 2025 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const IdentifiedError = require("../identified-error.js")
const locationFromPath = require("./location-from-path.js")
const loc = require("./location-template-literal.js")

levels = {
	error: "error",
	info: "info",
	verbose: "verbose"
	}

Message.levels = levels
Message.locationFromPath = locationFromPath

module.exports = {
	msg,
	Message,
	loc
	}

function msg(...args){ //Functional shorthand
	return new Message(...args)
	}

function Message(o){
	this.rule = o.rule
	if(Object.keys(levels).includes(o.level ?? "error")){
		this.level = o.level ?? "error"
		} else {
		throw new IdentifiedError(3003,`Message level must be error(default), info, or verbose. Received ${o.level}`)
		}
	if(o?.location){
		if(Array.isArray(o.location)){
			this.location = locationFromPath(o.location)
			} else {
			this.location = o.location
			}
		}
	this.description = o.description
	this.exempt = o.exempt
	this.hint = o.hint
	//this.data = o.data
	}

