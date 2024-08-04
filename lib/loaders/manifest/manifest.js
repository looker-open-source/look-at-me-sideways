
module.exports = loadManifest

const fs = require('fs').promises;
const pathlib = require('path');
const defaultProcess = process;
const manifestMergeMutate = require('./manifest-merge-mutate.js');
const addMetadata = require('./non-lkml-add-metadata-mutate.js');
const maybeYamlParser = maybeRequire('js-yaml')
	|| {load: ()=>{throw "Optional dependency `js-yaml` not available. Please install it separately."}}
const lkmlParser = require('lookml-parser');

const conditionalCommentString = "LAMS";

// Possible meanings of manifest spec string
const INVALID = "invalid argument value";
const OBJECT = "JavaScript object";
const INLINE_JSON = "inline JSON";
const YAML_PATH = "YAML path";
const JSON_PATH = "JSON path"
const LKML_PATH= "lkml path";
function detectManifestSpecMeaning(spec){
	if(spec && typeof spec==="object"){return OBJECT}
	if(typeof spec !== "string"){return INVALID}
	if(spec === ""){return INVALID}
	if(spec.match(/^\s*\{\s*"[\s\S]*\}\s*$/)){return INLINE_JSON}
	if(spec.match(/\.ya?ml$/)){return YAML_PATH}
	return LKML_PATH;
}

async function loadManifest(
	project,
	{
		cwd,
		manifestDefaults,
		manifestOverrides,
	}={},
	{
		process = defaultProcess
	}={}
){
	let messages = [];
	const manifest = {};

	cwd = cwd || process.cwd();

	const read = async(path) => await fs.readFile(pathlib.resolve(cwd,path), {encoding:"utf8"})
	const info = (msg,loc) => messages.push({level:"info", description:msg,location:loc||"project"});
	const err =  (msg,loc) => messages.push({level:"error",description:msg,location:loc||"LAMS"});

	// Manifest defaults argument is first to be merged in
	if(manifestDefaults){
		let spec = manifestDefaults
		let specMeaning = detectManifestSpecMeaning(spec)
		let contents = {}
		try {
			switch(specMeaning){
				case INVALID: throw "Invalid `manifestDefaults` argument"; break;
				case OBJECT: contents = addMetadata(spec); break;
				case INLINE_JSON: contents = addMetadata(JSON.parse(spec)); break;
				case JSON_PATH: contents = addMetadata(JSON.parse(await read(spec))); break;
				case YAML_PATH: contents = addMetadata(maybeYamlParser.load(await read(spec)));break;
				case LKML_PATH: contents = lkmlParser.parse(await read(spec),{conditionalCommentString});break;
			}
			manifestMergeMutate(manifest, contents)
			info(`Default manifest settings read from ${specMeaning}`)
			messages = messages.concat(msgManifestOverview(contents,"Default","verbose"))
		}
		catch(e){
			err(`Unable to load manifest settings from manifestDefaults (${specMeaning}). ${e.message}.`)
		}
	}
	
	// If a project.manifest is returned by the lookml parser (type:manifest file is among the files read in the project)
	if (project.manifest) {
		manifestMergeMutate(manifest, project.manifest)
		info(`Project manifest settings read from ${project.manifest.$file_path}`, 'project.manifest');
		messages = messages.concat(msgManifestOverview(project.manifest,"Project","verbose"));
	}

	// Manifest argument (merge last since it should win out over others)
	if(manifestOverrides){
		let spec = manifestOverrides
		let specMeaning = detectManifestSpecMeaning(spec)
		let contents = {}
		try {
			switch(specMeaning){
				case INVALID: throw "Invalid `manifest` override argument"; break;
				case OBJECT: contents = addMetadata(spec); break;
				case INLINE_JSON: contents = addMetadata(JSON.parse(spec)); break;
				case JSON_PATH: contents = addMetadata(JSON.parse(await read(spec))); break;
				case YAML_PATH: contents = addMetadata(maybeYamlParser.load(await read(spec)));break;
				case LKML_PATH: contents = lkmlParser.parse(await read(spec),{conditionalCommentString});break;
			}
			manifestMergeMutate(manifest, contents)
			info(`Override manifest settings read from ${specMeaning})`)
			messages = messages.concat(msgManifestOverview(contents,"Override","verbose"))
		}
		catch(e){
			err(`Unable to load manifest settings from manifest override (${specMeaning}). ${e.message}.`)
		}
	}
	messages = messages.concat(msgManifestOverview(manifest,"Final","info"))
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

function msgManifestOverview(manifest, descriptor, level){
	const messages = [];
	const manifestKeys = Object.keys(manifest).filter((key)=>key[0]!=='$');
	messages.push({level, description: `${descriptor} manifest properties: ${manifestKeys.slice(0, 8).join(', ')}${manifestKeys.length>8?'...':''}`});
	if (manifest.rule) {
		const ruleKeys = Object.keys(manifest.rule).filter((key)=>key[0]!=='$');
		messages.push({level, 
			description: `${descriptor} rules: ${ruleKeys.slice(0, 6).join(', ')}`
				+ (ruleKeys.length>6 ? ('... +'+(ruleKeys.length-6)):'')
		});
	}
	return messages
}