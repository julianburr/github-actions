const cp = require('node:child_process');
const fs = require('node:fs');

const { getInput } = require('@actions/core');
const got = require('got');
const semver = require('semver');

const packagePath = getInput('package-path');
const access = getInput('access');

function canPublish(version, publishedVersion) {
  // No published version means the package hasn't been published yet
  return !publishedVersion || semver.gt(version, publishedVersion);
}

async function getPackageDetails() {
  console.log(`Getting package.json for path: ${packagePath}/package.json`);
  const packageJsonString = fs
    .readFileSync(`${packagePath}/package.json`)
    .toString();
  const packageJson = JSON.parse(packageJsonString);
  const packageName = packageJson.name;

  try {
    console.log(`Retrieving package details for registry for ${packageName}`);
    const res = await got(`https://registry.npmjs.org/${packageName}`).json();

    return {
      path: packagePath,
      packageJson,
      distTags: res?.['dist-tags']
    };
  } catch (err) {
    console.error(`Something went wrong retrieving package details: ${err}`);

    // Not finding the package just means it hasn't been published yet so ignore the error
    if (err?.response?.statusCode !== 404) {
      throw err;
    }

    console.info(
      'Error was 404, package probably not published yet - returning details'
    );

    return {
      path: packagePath,
      packageJson,
      distTags: null
    };
  }
}

async function main() {
  const packageDetails = await getPackageDetails();

  for (const name in packageDetails) {
    // Get publish config from package json
    const package = packageDetails[name];

    // Get tag from version, if version starts with `0.0.0-*` use whatever is in that version as the tag,
    // e.g. `0.0.0-experimental-[hash]` will result in the tag `experimental`
    const version = package.packageJson.version;
    const isRC = package.packageJson.version.startsWith('0.0.0-');
    const isNewVersion = canPublish(
      package.packageJson.version,
      package.distTags?.[tag]
    );

    const tag = isRC ? version.match(/^0\.0\.0-([^\.-]+)/)[1] : 'latest';

    if (!isRC && !isNewVersion) {
      console.info(
        `Ignoring package ${name}\n\tCurrent version: ${package.packageJson.version}\n\tComparison version: ${package.distTags?.[tag]}`
      );
      return;
    }

    // Otherwise attempt release
    console.log(`Publishing ${name} with tag '${tag} and access '${access}'`);
    try {
      cp.execSync(
        `cd ${package.path} && npm publish --tag ${tag} --access ${access}`
      );
    } catch {
      console.error(`Publishing failed for ${name}`);
    }
  }
}

main();
