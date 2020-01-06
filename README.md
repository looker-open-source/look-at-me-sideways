# Look At Me Sideways (LAMS)

![>_>](docs/img/logo.png)

LAMS is a style guide and linter for [Looker](https://looker.com/)'s LookML data modeling language. It is designed to help a team of developers to produce more maintainable LookML projects.

- The [style guide](https://looker-open-source.github.io/look-at-me-sideways/rules.html) alone can help your project, even without enforcement by the linter.
- The linter can be configured to enforce rules from the style guide for all commits to your master branch.
- The linter also allows you to conveniently specify custom rules to enforce.
- In addition to enforcing rules, the linter also produces markdown files to help developers navigate the project.

Interested? See a video of LAMS in action!

[![LAMS video](docs/img/video-cover.png)](https://drive.google.com/file/d/1SYZxcbMs-NbT1iaThbz_CNjDXKhn3Wrt/view)

## Contents

- [Functionality & Features](#functionality--features)
	- [Predefined Linter Rules](#predefined-linter-rules)
	- [Rule Exemptions](#rule-exemptions)
	- [Generated Markdown Output](#generated-markdown-output)
	- [Custom Rules](#custom-rules)
- [Deployment Examples](#deployment-examples)
	- [Local Interactive Usage](#local-interactive-usage)
	- [Github Action](#github-action)
	- [Dockerized Jenkins Server](#dockerized-jenkins-server)
- [Configuration](#configuration)
	- [Command-line arguments](#command-line-arguments)
	- [Manifest.lkml arguments](#manifestlkml-arguments)
- [About](#about)

## Functionality & Features

### Predefined Linter Rules

The linter currently enforces rules K1-4, F1-4, E1-2, and T1-10 from the [style guide](https://looker-open-source.github.io/look-at-me-sideways/rules.html).

It currently does not resolve `extends` references, so if you are complying with a rule via extension, use a rule exemption as noted below.

### Rule Exemptions

You can opt-out of rules either globally or granularly using `rule_exemptions`.

The rule exemption syntax encourages developers to document the reason for each such exemption:

```lkml
view: rollup {
  derived_table: {
    sql_trigger_value: SELECT CURRENT_DATE() ;;
    # LAMS
    # rule_exemptions: {
    #  T1: "2018-11-12 - I can't use datagroups for this super special reason and Bob said it's ok"
    # }
    sql: SELECT ...
```

Note: For large projects with many exemptions, we suggest starting the reasons with the Y-M-D formatted date on which they were added, for easier review in your issue report.

If you want to entirely opt-out of checking a particular rule, you can specify the exemptions in your project's manifest.lkml file. See [customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams) for additional details.

### Generated Markdown Output

One of the primary ways that LAMS gives developers feedback, in addition to any integrations with your CI workflow, is by adding its findings to markdown files in your project, so that they can be viewed in Looker's IDE. Here is an example of a resulting markdown file as displayed in Looker:

![Markdown example](docs/img/markdown-example.gif)

### Custom Rules

In addition to linting against its [style guide](https://looker-open-source.github.io/look-at-me-sideways/rules.html), LAMS also lets you specify your own rules. See [Customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams).

## Deployment Examples

Although LAMS can be deployed in many ways to fit your specific CI flow, we have put together a few examples and resources to get you up and running quicker. (If you'd like to contribute your configuration, [get in touch](https://github.com/looker-open-source/look-at-me-sideways/issues/new)!)

- **Local Interactive Usage** - To use LAMS with the least overhead for simple interactive local use and testing:

```bash
npm install -g @looker/look-at-me-sideways
cd <your-lookml-project>
lams
```

- **[Github Action](https://looker-open-source.github.io/look-at-me-sideways/github-action)** - This option is very quick to get started if you're using Github, and offers a compromise between convenience of setup and per-commit run performance.
- **[Dockerized Jenkins Server](https://github.com/looker-open-source/look-at-me-sideways/blob/master/docker/README.md)** - We have provided a Docker image with an end-to-end configuration including a Jenkins server, LAMS, and Github protected branches & status checks configuration. 
- **[Gitlab CI](https://looker-open-source.github.io/look-at-me-sideways/gitlab-ci)** - The most convenient option for users of GitLab, and offers similarly low overhead as our dockerized Jenkins configuration.


## Configuration

### Command-line arguments

- **reporting** - Required. One of `yes`, `no`, `save-yes`, or `save-no`. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **report-user** - An email address to use in reporting. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **report-license-key** - A Looker license key to use in reporting. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **cwd** - A path for LAMS to use as its current working directory. Useful if you are not invoking lams from your LookML repo directory via the globally installed lams command.
- **source** - A glob specifying which files to read. Defaults to `**/{*.model,*.explore,*.view,manifest}.lkml`.
- **projectName** - An optional name for the project, used to generate links back to the project in mardown output. Specifying this in manifest.lkml is preferred.
- **allowCustomRules** - Experimental option. DO NOT USE TO RUN UNTRUSTED CODE. Pass a value to allow running of externally defined JS for custom rules.
- **jenkins** - Set to indicate that LAMS is being run by Jenkins and to include the build URL from ENV variables in the markdown output.
- **output-to-cli** - Primarily intended for debugging. Setting it will output a verbose listing of errors and warnings to stdout.
- **onParserError - Set to "fail" to indicate that LookML parsing errors should fail the linter. By default, parsing errors are logged and ignored.

### Manifest.lkml arguments

If your LookML project doesn't have a manifest.lkml file, you may want to consider adding one! LAMS uses the following information from your project's mainfest.lkml file:

- **name** - Recommended. A name for the project, used to generate links back to the project in mardown output. If the native LookML validator complains about an unnecessary project name, you can use a conditional #LAMS comment to specify it.
- **rule_exemptions** - Optional. Used to entirely opt out of rules.  See [customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams)
- **rule: rule_name** - Optional. Used to specify custom rules.  See [customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams)

## About

### Privacy Policy

LAMS respects user privacy. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.

### License

LAMS is Copyright (c) 2018 Looker Data Sciences, Inc. and is licensed under the MIT License. See [LICENSE.txt](https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt) for license details.

### Support

LAMS is NOT officially supported by Looker. Please do not contact Looker support for issues with LAMS. Issues may be reported via the [Issues](https://github.com/looker-open-source/look-at-me-sideways/issues) tracker, but no SLA or warranty exists that they will be resolved.

### Authors

LAMS has primarily been developed by [Joseph Axisa](https://github.com/josephaxisa) and [Fabio Beltramini](https://github.com/looker-open-source). See [all contributors](https://github.com/looker-open-source/look-at-me-sideways/graphs/contributors)

### Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/looker-open-source/look-at-me-sideways](https://github.com/looker-open-source/look-at-me-sideways).

Trying to install LAMS for development?

```bash
git clone git@github.com:looker-open-source/look-at-me-sideways.git
cd look-at-me-sideways
mv npm-shrinkwrap.dev.json npm-shrinkwrap.json 
npm install
```

Publishing an update? The following hooks will run:

```bash
npm version {minor|major|patch}
> Pre-verion: npm run lint-fix
> Pre-verion: npm run test

npm publish
> Pre-publish: npm shrinkwrap
> Pre-publish: mv npm-shrinkwrap.json npm-shrinkwrap.dev.json
> Pre-publish: npm prune --prod
> Pre-publish: npm shrinkwrap
```

### Code of Conduct

This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the
[Contributer Covenant Code of Conduct](https://www.contributor-covenant.org/version/1/4/code-of-conduct). Concerns or
incidents may be reported confidentially to fabio@looker.com.

`>_>`
