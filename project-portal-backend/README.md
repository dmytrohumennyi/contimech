# ContiMech Project Portal Backend

This backend protects project tiles and project slide files. The static website does not contain private project metadata or slide files.

## Security model

- The public page `projects.html` contains only the login UI.
- Project tiles are returned by `GET /api/projects` only after authorization.
- Project slides are served by `GET /api/projects/:id/slide` only after authorization.
- Passwords are not stored in source code. Use a bcrypt hash in environment variables.
- Sessions are stored in an HTTP-only secure cookie. For the subdomain setup, a host-only cookie on `projects.contimech.org` is usually enough.
- Login attempts are rate-limited.
- Files should be stored in a private S3 bucket or in a private server directory, not in the static website repository.

## Local setup

```bash
cd project-portal-backend
npm install
cp .env.example .env
npm run hash-password -- 'replace-with-a-strong-password'
```

Put the generated hash into `PROJECT_PORTAL_PASSWORD_HASH` in `.env`.

Run:

```bash
npm start
```

For local testing, set `PUBLIC_API_BASE=http://localhost:8080` and update `window.CONTIMECH_PROJECT_PORTAL_API` in `projects.html` or override it during deployment.

## AWS deployment concept

Recommended layout:

- `contimech.org` — static website.
- `projects.contimech.org` — protected backend/API.
- S3 private bucket — project presentations, videos, photos, and PDFs.
- CloudFront / ALB / App Runner / ECS / Lambda — delivery layer.
- Backend verifies session before returning metadata and before streaming files.

Do not upload project slides, videos, photos, or private reports into the public website repository.
