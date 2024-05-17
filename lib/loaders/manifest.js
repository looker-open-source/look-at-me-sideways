
module.exports = loadManifest

const info = {level:"info"}
const maybeYamlParser = maybeRequire('js-yaml')
const fs = require('fs').promises
const pathlib = require('path')

async function loadManifest(
	project,
	options = {}
){
	const messages = [];
	const manifest = {};
	if(options.manifestDefaults){
		const manifestPath = pathlib.resolve()
		messages.push({...info, description: `Project manifest settings read from manifest defaults`});
	}
	if (project.manifest) {
		messages.push({...info, description: `Project manifest settings read from ${project.manifest.$file_path}`, location: 'project.manifest'});
		manifestMergeMutate()
	} else {
		messages.push({...projectManifestInfo, description: `No manifest.lkml file available`});
	}
	if(options.manifest){
		messages.push({...info, description: `Project manifest settings read from manifest argument (DEPRECATED. Prefer manifest_overrides instead.)`});
		manifestMergeMutate()
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

function manifestMergeMutate(target, toAdd){
	const ruleMerge = 
		!target.rule && !toAdd.rule ? {} :
		{
			rule: {
				...(target.rule||{}),
				...(toAdd.rule||{})
			}
		};
	Object.assign(target, toAdd);
	Object.assign(target, ruleMerge);
	return targe;t
}

function maybeRequire(module){
	try{
		return require(module);
	}
	catch(e){
		return undefined;
	}
}