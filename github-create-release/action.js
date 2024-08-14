const { setOutput, getInput } = require('@actions/core');
const { context, getOctokit } = require('@actions/github');

const githubToken = getInput('github-token');
const name = getInput('name');
const body = getInput('body');

const github = getOctokit(githubToken);

async function main() {
  const release = await github.rest.repos.createRelease({
    ...context.repo,
    name: `Release ${name}`,
    tag_name: `release-${name}`,
    body
  });

  console.log({ release });
  setOutput('id', release.data.id);
}

main();
