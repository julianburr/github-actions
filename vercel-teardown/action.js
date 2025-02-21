const { execSync, spawn } = require('node:child_process');

const { getInput } = require('@actions/core');
const { context, getOctokit } = require('@actions/github');

const githubToken = getInput('github-token');
const vercelToken = getInput('vercel-token');
const vercelOrgId = getInput('vercel-org-id');
const vercelProjectNames = getInput('vercel-project-names');
const vercelAliases = getInput('vercel-aliases');

const github = getOctokit(githubToken);

// HACK: vercel cli for whatever f**ing reason logs some of the normal output to
// stderr instead of stdout, so we capture both channels here manually :/
function getVercelOutput(command, args) {
  return new Promise((resolve, reject) => {
    let output = '';
    const child = spawn(command, args);
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    child.on('close', () => {
      resolve(output);
    });
    child.on('error', (err) => {
      console.error(err);
      reject(err);
    });
  });
}

async function main() {
  const projects = vercelProjectNames
    ?.split(/[,\n]/)
    .map((name) => name.trim())
    .filter(Boolean);

  // Get current Github PRs
  const pulls = await github.rest.pulls.list({
    ...context.repo,
    state: 'open',
    per_page: 100
  });
  const activePrNumbers = pulls.data.map((pull) => pull.number);

  // Get current aliases
  const aliasesExpression = `${vercelProjectNames},${vercelAliases}`
    ?.split(/[,\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .join('|');
  console.log({ aliasesExpression });
  const aliasUrlRegex = new RegExp(
    `pr-([0-9]+)--(${aliasesExpression}).vercel.app`,
    'g'
  );
  const aliasNumberRegex = /pr-([0-9]+)/;
  const nextPageRegex =
    /vercel alias ls --token ([^\s]+) --scope ([^\s]+) --next ([0-9]+)/;

  const mapAliasUrls = (url) => ({
    url,
    number: parseInt(url.match(aliasNumberRegex)[1])
  });

  const aliasesOutput = await getVercelOutput(`npx vercel`, [
    `--token=${vercelToken}`,
    `--scope=${vercelOrgId}`,
    `alias`,
    `ls`
  ]);

  let aliases = aliasesOutput.match(aliasUrlRegex)?.map?.(mapAliasUrls) || [];
  let nextCommand = aliasesOutput.match(nextPageRegex);
  while (nextCommand && nextCommand[0]) {
    const nextArgs = [
      `alias`,
      `ls`,
      `--token=${nextCommand[1]}`,
      `--scope=${nextCommand[2]}`,
      `--next=${nextCommand[3]}`
    ];
    console.log({ nextArgs });
    const nextAliasesOutput = await getVercelOutput(`npx vercel`, nextArgs);
    console.log({ nextAliasesOutput });
    const nextMatches = nextAliasesOutput.match(aliasUrlRegex);
    console.log({ nextMatches });
    if (nextMatches) {
      aliases = aliases.concat(nextMatches.map(mapAliasUrls));
    }
    nextCommand = nextAliasesOutput.match(nextPageRegex);
  }

  // Remove all aliases without an active Github PR
  console.log('aliases', { aliases });
  aliases.forEach((alias) => {
    if (!activePrNumbers.includes(alias.number)) {
      try {
        execSync(
          `npx vercel --token=${vercelToken} alias rm ${alias.url} --yes --scope ${vercelOrgId}`
        );
        console.log(`Removed alias ${alias.url}`);
      } catch (e) {
        console.log(`Could not remove alias ${alias.url}`);
        console.error(e);
      }
    }
  });

  // Remove all orphaned deployments without an alias
  projects.forEach((projectName) => {
    try {
      execSync(
        `npx vercel --token=${vercelToken} rm ${projectName.trim()} --safe --yes --scope ${vercelOrgId}`
      ).toString();
      console.log(`Removed orphaned deployments for ${projectName.trim()}`);
    } catch (e) {
      // No orphaned deployments found, do nothing
      console.log(`No orphaned deployments found for ${projectName.trim()}`);
      console.log({ e });
    }
  });
}

main();
