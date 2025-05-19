/* Copyright (c) 2025 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const IdentifiedError = require("./identified-error")

levels = {
	error: "error",
	info: "info",
	verbose: "verbose"
	}

Message.levels = levels

module.exports = {
	msg,
	Message
	}

function msg(...args){ //Functional shorthand
	return new Message(...args)
	}

function Message(o){
	if(o?.rule){
		this.rule = o.rule
		} else {
		throw new IdentifiedError(3001,"Messages require a rule")
		}
	// if(o?.location){
	// 	this.location = o.location
	// 	throw new IdentifiedError(3002,"Messages require a location")
	// 	}
	if(Object.keys(levels).includes(o.level ?? "error")){
		this.level = o.level ?? "error"
		} else {
		throw new IdentifiedError(3003,`Message level must be error(default), info, or verbose. Received ${o.level}`)
		}
	this.description = o.description
	this.data = o.data
	}


