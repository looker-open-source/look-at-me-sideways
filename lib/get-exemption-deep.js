const getExemption = require('./get-exemption.js');
const formatLocation = require('./custom-rule/format-location.js');

module.exports = function getExemptionDeep({match, rule}) {
	// Check match for being exempt and return early (without evaluating expression) if so
	const {path, project} = match;
	const ruleDef = project.manifest && project.manifest.rule && project.manifest.rule[rule];

	if (ruleDef && ruleDef.allow_exemptions === false) {
		return;
	}

	// Check the manifest for global exemptions
	const manifestExempt = getExemption(project && project.manifest, rule);
	if (manifestExempt) {
		return `Manifest exemption: ${manifestExempt}`;
	}

	// Check for central exemptions
	if (project.centralExemptions) {
		for (let p=0, P=path.length; p<P; p++) {
			const location = formatLocation(path.slice(0, p+1));
			const isExempt = project.centralExemptions.has(rule + ' ' + location);
			if (isExempt) {
				return `Central exemption: ${location}`;
			}
		}
	}

	// Check for local exemptions
	const localExempt = path.reduce(
		({modelFragment, exempt}, pathpart)=>({
			exempt: exempt || getExemption(modelFragment[pathpart], rule),
			modelFragment: modelFragment[pathpart],
		}),
		{modelFragment: project},
	).exempt;

	if (localExempt) {
		return `Local exemption: ${localExempt}`;
	}
};
