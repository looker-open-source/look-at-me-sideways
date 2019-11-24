---
favicon: img/logo.png
---
# Running LAMS via Github Actions

This example shows how to run LAMS with Github Actions.

Note: As compared to our dockerized Jenkins configuration, Github Actions is a quicker way to get set up, but may be slower since the former does not require as much set-up per run (Node.js installation, LAMS installation), and can run on a dedicated instance. 

Also, this example is still a work in progress: it will run LAMS and add the markdown files back to your project, but does not yet set commit statuses to hook into the protected branches feature. Pull requests very welcome!

## Instructions

- Inside your Github-connected LookML repo, add the following file at `.github/workflows/main.yml`
- Populate the parameters within the "Run LAMS" step & uncomment

<!-- {% raw %} -->
```yaml
name: LookML CI

on: [push]

jobs:
  lams_job:
    runs-on: ubuntu-latest
    name: LAMS LookML Linter Job
    steps:
    #- name: Ignore pushes from action@github.com
    #- name: Ignore pushes to master?
    - name: Checkout your LookML
      uses: actions/checkout@v1
    - name: Setup Node
      uses: actions/setup-node@v1
      with:
        node-version: '10.x'
    - name: Install LAMS
      run: npm install -g @looker/look-at-me-sideways
    - name: Run LAMS
      # ### Populate `run` parameters below & uncomment that line ### 
      # See [PRIVACY.md](https://github.com/looker-open-source/look-at-me-sideways/blob/master/PRIVACY.md)
      # run: lams --reporting=(yes|no) --report-license-key=AAA...AAA --report-user=bob@acme.com || error=true
    # TODO: Set status for commits.
    # https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-status-checks
    #- name: Set commit status
    - name: Commit LAMS feedback (e.g., issues.md)
      run: |
        git add .
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git commit -m "LAMS feedback"
    - name: Push changes
      uses: ad-m/github-push-action@02b0b75d447f0098d40d0d65a3e6cdf2119e6f60
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        branch: ${{github.ref}}
```
<!-- {% endraw %}) -->