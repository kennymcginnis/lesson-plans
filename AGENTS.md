# Repository Instructions

## Pushing to GitHub

When asked to push, use the `kenny-mcginnis` GitHub account, which has write
access to `kennymcginnis/lesson-plans`. The `kmcgin1_aexp` account cannot push here.

If a push fails with a permission error, switch accounts and retry:

```sh
gh auth switch --hostname github.com --user kenny-mcginnis
git push
```

This switches the active GitHub CLI account for github.com across repositories.
This repository's Git credential helper uses the active GitHub CLI account.
If the push is rejected because the remote has newer commits, inspect and
integrate those changes before retrying; do not force-push.

## Onsite Dependency Installation

Onsite, npm must use `artifactory.aexp.com` instead of
`https://registry.npmjs.org/`. With npm configured for the onsite Artifactory
registry, delete `package-lock.json` and run `npm install` to regenerate the
lockfile and reinstall dependencies using that registry.