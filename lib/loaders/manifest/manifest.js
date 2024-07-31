
module.exports = loadManifest

const info = {level:"info"}
const maybeYamlParser = maybeRequire('js-yaml')
const fs = require('fs').promises
const pathlib = require('path');
const manifestMergeMutate = require('./manifest-merge-mutate.js');
const defaultProcess = process;

async function loadManifest(
	project,
	options = {
		cwd,
		manifestDefaults,
		manifestObject,
		manifestOverrides,
	}={},
	{
		process = defaultProcess
	}
){
	const messages = [];
	const manifest = {};
	const info = {level:"info"};
	cwd = cwd || process.cwd();

	if(options.manifestDefaults){
		let argument = options.manifestDefaults
		if(typeof argument !== "string"){...}
		
		let contentsAs;
		let contents;
		if(argument[0]==="{"){
			contentsAs = "inline JSON";
			contents = 
		}
		else if(argmument.match(/\.ya?ml$/)){
			contentsAs = "YAML file";
		}
		else{
			contentsAs = "JSON file";
		}

		const manifestPath = pathlib.resolve(cwd)
		
		messages.push({...info, description: `Project manifest settings read from manifest defaults as ${contentsAs}`});
	}
	if (project.manifest) {
		messages.push({...info, description: `Project manifest settings read from ${project.manifest.$file_path}`, location: 'project.manifest'});
		manifestMergeMutate()
	} else {
		messages.push({...info, location: 'project', description: `No manifest.lkml file available`});
	}
	if(options.manifest){
		messages.push({...info, description: `Project manifest settings read from manifest argument (DEPRECATED. Prefer manifest_overrides instead.)`});
		manifestMergeMutate(manifest, options.manifestObject)
	}
	if(options.manifestOverrides){
		messages.push({...info, description: `Project manifest settings read from manifest overrides`});
		manifestMergeMutate()
	}

	project.manifest = {
		...(project.manifest||{}),
		...(options.manifest||{}),
	};

	const manifestKeys = Object.keys(project.manifest).filter((key)=>key[0]!=='$');
	messages.push({level:'info', description: `Manifest properties: ${manifestKeys.slice(0, 8).join(', ')}${manifestKeys.length>8?'...':''}`});
	if (project.manifest.rule) {
		const ruleKeys = Object.keys(project.manifest.rule).filter((key)=>key[0]!=='$');
		messages.push({...manifestInfo, description: `Rules: ${ruleKeys.slice(0, 6).join(', ')}${ruleKeys.length>6?'...':''}`});
	}
	return {
		manifest,
		messages
	}
}


function maybeRequire(module){
	try{
		return require(module);
	}
	catch(e){
		return undefined;
	}
}