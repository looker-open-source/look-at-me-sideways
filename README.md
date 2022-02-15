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
	- [Custom Rules](#custom-rules)
	- [Output](#output)
- [Deployment Examples](#deployment-examples)
- [Configuration](#configuration)
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

### Custom Rules

In addition to linting against its [style guide](https://looker-open-source.github.io/look-at-me-sideways/rules.html), LAMS also lets you specify your own rules. See [Customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams).


### Output

Once LAMS has evaluated your project against the necessary rules, the resulting list of messages are communicated back to you through one of several output modes.

The default mode is a human-readable tabble logged to the command line / stdout, where each line represents a distinct message:

!["Lines" output example](docs/img/lines-output.png)

Another available output mode is formatting the messages into a markdown file in your project, so that they can be viewed in Looker's IDE. Here is an example of a resulting markdown file as displayed in Looker:

!["Markdown" output example](docs/img/markdown-example.gif)

## Deployment Examples

Although LAMS can be deployed in many ways to fit your specific CI flow, we have put together a few examples and resources to get you up and running quicker. (If you'd like to contribute your configuration, [get in touch](https://github.com/looker-open-source/look-at-me-sideways/issues/new)!)

Regardless of which example you follow, we recommend pinning your LAMS version to a particular major version.

- **Local Interactive Usage** - To use LAMS with the least overhead for simple interactive local use and testing:

```bash
npm install -g @looker/look-at-me-sideways@2
cd <your-lookml-project>
lams
```

- **[Github Action](https://looker-open-source.github.io/look-at-me-sideways/github-action)** - This option is very quick to get started if you're using Github, and offers a compromise between convenience of setup and per-commit run performance.
- **[Dockerized Jenkins Server](https://github.com/looker-open-source/look-at-me-sideways/blob/master/docker/README.md)** - We have provided a Docker image with an end-to-end configuration including a Jenkins server, LAMS, and Github protected branches & status checks configuration. 
- **[GitLab CI](https://looker-open-source.github.io/look-at-me-sideways/gitlab-ci)** - A community-contributed configuration for GitLab, which offers similarly low overhead as our dockerized Jenkins configuration
- **[CircleCI](https://github.com/renewdotcom/renew-looker-template/blob/master/.circleci)** - A community-contributed configuration for CircleCI (external link) 

## Configuration

### Command-line arguments

- **reporting** - Required. One of `yes`, `no`, `save-yes`, or `save-no`. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **report-user** - An email address to use in reporting. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **report-license-key** - A Looker license key to use in reporting. See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md) for details.
- **output** - A comma-separated string of output modes from among: `lines` (default), `markdown`, `markdown-developer`, `jenkins`, `legacy-cli`
- **source** - A glob specifying which files to read. Defaults to `**/{*.model,*.explore,*.view,manifest}.lkml`.
- **cwd** - A path for LAMS to use as its current working directory. Useful if you are not invoking lams from your LookML repo directory.
- **project-name** - An optional name for the project, used to generate links back to the project in mardown output. Specifying this in manifest.lkml is preferred.
- **manifest** - A JSON-encoded object to override any properties that are normally set via the manifest.lkml file.
- **on-parser-error** - Set to "info" to indicate that LookML parsing errors should not fail the linter, but yield an `info` level message instead (not all output modes display `info` level messages)
- **verbose** - Set to also output `verbose` level messages, for output modes that support it (`lines`)
- **date-output** - Set to "none" to skip printing the date at the top of the `issues.md` file.
- **allow-custom-rules** - Experimental and not recommended. Used to approve the running of Javascript-based custom rules. DO NOT USE TO RUN UNTRUSTED CODE. See [custom rules](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams) for details.

### Manifest.lkml arguments

If your LookML project doesn't have a manifest.lkml file, you may want to consider adding one! LAMS uses the following information from your project's mainfest.lkml file:

- **name** - Recommended. A name for the project, used to generate links back to the project in mardown output. If the native LookML validator complains about an unnecessary project name, you can use a conditional #LAMS comment to specify it.
- **rule_exemptions** - Optional. Used to entirely opt out of rules.  See [customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams)
- **rule: rule_name** - Optional. Used to specify custom rules.  See [customizing LAMS](https://looker-open-source.github.io/look-at-me-sideways/customizing-lams)

## About

### Release Notes

- [v2](https://looker-open-source.github.io/look-at-me-sideways/release-notes/v2)

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
