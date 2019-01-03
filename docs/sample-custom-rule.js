/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

/*	This sample custom rule checks all models for a hypothetical naming convention
	within the model's connection string to ensure that users developing against
	a staging/dev connection don't accidentally push that connection to prod

	See the main LAMS README file for details on how to call your custom rules
	*/
module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'sample-custom-rule'; // Note that each custom rule script may implement multiple "rules" if desired
	// Rule names of the form [A-WY-Z][0-9]+ are reserved for future LAMS usage
	let models = project.models || [];
	for (let model of models) {
		if (model.connection && model.connection.match(/_dev$/)) {
			let location = `model:${model._model}`;
			let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
			messages.push({
				location, // The logical location within the project/model
				path, // The URL path to link to the error (as closely as possible)
				rule,
				exempt: false, // Pass either false, or a non-empty string with the exemption reason.
				// Truthy exemptions will prevent warnings& errors from failing the build
				level: 'error', // info | warning | error
				description: `${model._model} utilises staging connection, ${model.connection}.`,
			});
		}
	}

	return {
		messages,
	};

	/* Sample flow for "per-model" / "per-explore" rules
	let models = project.models || [];
	for (let model of models) {
		let explores = model.explores || [];
		for (let explore of explores) {
			let joins = explore.joins || [];
			for (let join of joins) {
				let location = `model:${model._model}/explore:${explore._explore}/join:${join._join}`;
				let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
				if ( ...condition... ) {
					messages.push({
						location, path, rule, exempt:false, level: 'error',
						description: `...`,
					});
				}
			}
		}
	}
	*/

	/* Sample flow for "per-file" or "per-view" rules
	let files = project.files || [];
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let fields = view.measures||[];
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				if ( ...condition... ) {
					messages.push({
						location, path, rule, exempt:false, level: 'error',
						description: `...`,
					});
				}
			}
		}
	}
	*/
};
