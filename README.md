# Hortsoc.org

Public Astro site for `hortsoc.org`.

This repository is the publishable website source. Internal migration scripts, raw source exports, and planning material live in the separate private build repository.

## Local Development

Prerequisites:

- Node 22
- `npm install`

Commands:

- `npm run dev`
- `npm run build`
- `npm run preview`

## Publishing

The private build repo is the main workbench. When source changes are ready for release, export the publishable website files into this repository, review the diff, then commit and push.

## GitHub Pages

This repository is configured to build on `main` and publish the generated site to the `gh-pages` branch.

- Set `Settings > Pages > Source` to `Deploy from a branch`.
- Set the publishing branch to `gh-pages` and the folder to `/(root)`.
- Push to `main` when you want a new Pages deploy.
- The workflow builds the site and commits the generated output into `gh-pages`.
- The production custom domain is `https://hortsoc.org/`.
