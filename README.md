# github-actions

Personal collection of github actions to use across projects. The idea is to have a single repo for all common actions, rather than having to have individual repos for each of them.

## How to use actions from this repo

```yml
# Check out the actions repo
# To lock down to specific version, you can define a specific commit sha as `ref` here
- name: Checkout shared actions repo
  uses: actions/checkout@master
  with:
    repository: julianburr/github-actions
    path: .github/shared

# For now you need to manually install dependencies for the actions
# Ideally in the future there will be a bundled version in the repo itself to remove this step
- name: Install actions dependencies
  shell: bash
  run: yarn --cwd=.github/shared

# Simply use any of the actions from the checked out repo
- name: Deploy app to vercel
  uses: ./.github/shared/vercel-deploy-app
  with:
    vercel-token: ${{ inputs.vercel-token }}
    vercel-org-id: ${{ inputs.vercel-org-id }}
    vercel-project-id: ${{ inputs.vercel-project-id }}
    vercel-project-name: ${{ inputs.vercel-project-name }}
    alias: ${{ inputs.alias }}
    is-production: ${{ inputs.is-production }}
```
