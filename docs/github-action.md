---
favicon: img/logo.png
---
# Running LAMS via Github Actions

- Inside your Github-connected LookML repo, you can specify [Github Actions](https://docs.github.com/en/actions) in `.github/workflows/main.yml`
- Populate the parameters within the "Run LAMS" step (see `XXXXX` placeholders below)
- Note: This configuration is helpful alongside pull requests. [Set "Pull Requests Required" within Looker](https://cloud.google.com/looker/docs/git-options#integrating_pull_requests_for_your_project).
- Note: This configuration is helpful alongside Github's [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) feature

# Standard configuration

This configuration is useful alongside

<!-- {% raw %} -->
```yaml
name: CI

on: [push]

jobs:
  lams_job:
    runs-on: ubuntu-latest
    name: LAMS LookML Linter Job
    steps:
    - name: Checkout your LookML
      uses: actions/checkout@v1
    - name: Setup Node
      uses: actions/setup-node@v1
      with:
        node-version: '16.x'
    - name: Install LAMS
      run: npm install -g @looker/look-at-me-sideways@3
    - name: Run LAMS
      # See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md)
      run: lams --reporting=XXXXX --report-license-key=XXXXX --report-user=XXXXX
```
<!-- {% endraw %}) -->

# ([BETA](https://github.com/looker-open-source/look-at-me-sideways/issues/142)) Incremental configuration

If at any point (for example, manually, or upon merging a set of changes), you wish to exempt all current errors in future runs, you can run LAMS with  `--output=add-exemptions` and add the resulting/updated `lams-exemptions.ndjson` file to your repo.
