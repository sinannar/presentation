# Deployment

The repository includes `.github/workflows/deploy.yml`.

- Pull requests run validation and a production build.
- Pushes to `main` build and deploy the `dist/` artifact through GitHub Pages.
- `actions/configure-pages` supplies the site origin and base path, so project Pages links remain valid.
- Enable **Settings → Pages → GitHub Actions** once for the repository.

For a local project-path check:

```sh
ASTRO_BASE=/sample-presentation npm run build
ASTRO_BASE=/sample-presentation npm run test:production
```

Do not claim a live deployment until Pages is enabled and the generated URL is checked.
