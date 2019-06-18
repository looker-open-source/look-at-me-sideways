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
	for (let model of project.models || []) {
		if (model.connection && model.connection.match(/_dev$/)) {
			// ^ Sample rule logic
			messages.push({
				rule: 'sample-custom-rule',
				// ^ Note that each custom rule script may implement multiple "rules" if desired
				//   Rule names of the form [A-WY-Z][0-9]+ are reserved for future LAMS usage
				location: `model:${model._model}`,
				// ^ The logical location within the project/model to show to your developers
				path: `/projects/${project.name}/files/${model._model}.model.lkml`,
				// ^The URL path to link to the error (as closely as possible)
				exempt: false,
				// ^ Pass either false, or a non-empty string with the exemption reason.
				//   Truthy exemptions will prevent warnings & errors from failing the build
				level: 'error', // info | warning | error
				description: `${model._model} utilises staging connection, ${model.connection}.`,
			});
		}
	}

	return {
		messages,
	};

	/* Sample flow for "per-model" / "per-explore" rules
	for (let model of project.models || []) {
		for (let explore of model.explores || []) {
			for (let join of explore.joins || []) {
				if ( ...condition... ) {
					messages.push({
						rule: '...',
						location: `model:${model._model}/explore:${explore._explore}/join:${join._join}`,
						path: `/projects/${project.name}/files/${model._model}.model.lkml`,
						exempt: false,
						level: 'error',
						description: `...`,
					});
				}
			}
		}
	}
	*/

	/* Sample flow for "per-file" or "per-view" rules
	for (let file of project.files || []) {
		for (let view of file.views || []) {
			for (let measure of view.measures || []) {
				if ( ...condition... ) {
					messages.push({
						rule: '...',
						location: `view:${view._view}/field:${field._measure}`,
						path: `/projects/${project.name}/files/${file._file_path}`,
						exempt: false,
						level: 'error',
						description: `...`,
					});
				}
			}
		}
	}
	*/
};
