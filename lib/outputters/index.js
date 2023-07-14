const outputters = {
	markdown: require("./markdown.js"),
	markdownDeveloper: require("./markdown-developer.js"),
	jenkins: require("./jenkins.js"),
};

module.exports = outputters;