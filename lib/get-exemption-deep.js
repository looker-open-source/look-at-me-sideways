const getExemption = require('./get-exemption.js');

module.exports = function getExemptionDeep({match, rule}) {
	// Check match for being exempt and return early (without evaluating expression) if so
	const {path, project} = match;
	const manifestExempt = getExemption(project && project.manifest, rule);
	const exempt =
		manifestExempt
		|| path.reduce(
			({modelFragment, exempt}, pathpart)=>({
				exempt: exempt || getExemption(modelFragment[pathpart], rule),
				modelFragment: modelFragment[pathpart],
			}),
			{modelFragment: project},
		).exempt;

	if (exempt) {
		return {
			match,
			exempt,
		};
	}
};
