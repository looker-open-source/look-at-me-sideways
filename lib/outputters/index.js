const outputters = {
	addExemptions: require('./add-exemptions'),
	jenkins: require("./jenkins.js"),
	legacyCli: require("./legacy-cli.js"),
	lines: require("./lines.js"),
	markdown: require("./markdown.js"),
	markdownDeveloper: require("./markdown-developer.js"),
};

module.exports = outputters;
