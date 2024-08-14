const { getInput } = require("@actions/core");
const { context, getOctokit } = require("@actions/github");

const { owner, repo } = context.repo;

const id = getInput("id");
const githubToken = getInput("github-token");
const prNumber = getInput("pr-number");
const content = getInput("content");

const github = getOctokit(githubToken);

async function main() {
  if (!prNumber) {
    throw new Error("PR number not defined!");
  }

  if (!content) {
    throw new Error("Comment content not defined");
  }

  const comments = await github.rest.issues.listComments({
    issue_number: prNumber,
    owner,
    repo,
  });

  const commentIdentifier = id
    ? `<!-- automated PR comment ${id} -->`
    : `<!-- automated PR comment -->`;

  if (id) {
    const comment = comments.data.find((comment) =>
      comment.body.startsWith(commentIdentifier)
    );
    if (comment) {
      github.rest.issues.deleteComment({
        issue_number: prNumber,
        owner,
        repo,
        comment_id: comment.id,
      });
    }
  }

  const body = `${commentIdentifier}\n\n${content}`;
  github.rest.issues.createComment({
    issue_number: prNumber,
    owner,
    repo,
    body,
  });
}

main();
