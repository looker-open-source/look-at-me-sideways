---
favicon: img/logo.png
---
# Running LAMS via Github Actions

This example shows how to run LAMS with Github Actions.

Note: As compared to our dockerized Jenkins configuration, Github Actions is a quicker way to get set up, but may be slower since the former does not require as much set-up per run (Node.js installation, LAMS installation), and can run on a dedicated instance. 

## Instructions

- Inside your Github-connected LookML repo, add the following file at `.github/workflows/main.yml`
- Populate the parameters within the "Run LAMS" step & uncomment

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
      run: lams --reporting=... --report-license-key=... --report-user=...
```
<!-- {% endraw %}) -->
