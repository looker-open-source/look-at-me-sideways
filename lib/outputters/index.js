const outputters = {
	markdown: require("./markdown.js"),
	markdownDeveloper: require("./markdown-developer.js"),
	jenkins: require("./jenkins.js"),
	legacyCli: require("./legacy-cli.js")
};

module.exports = outputters;