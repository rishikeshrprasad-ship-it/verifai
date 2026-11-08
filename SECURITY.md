# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Use GitHub's **private vulnerability reporting**: go to the repository's *Security* tab and choose *Report a vulnerability*. Include steps to reproduce, the affected component, and the impact if you can.

We aim to acknowledge reports within **7 days**. This is a student hackathon project, so timelines are best-effort.

## Supported versions

Only the latest commit on `main` is supported.

## Secrets

- Credentials live only in environment variables or your host's secret manager.
- `.env` is git-ignored. Only `.env.example` (placeholders) is committed.
- If you find a real key in this repo or its history, report it privately so it can be revoked.

## Hardening checklist for deployers

- [ ] `ALLOWED_ORIGINS` set to your exact frontend URL (no `*`)
- [ ] `ENV=production`, debug mode and auto-reload off
- [ ] Upload limit enforced; only PNG/JPEG/WebP accepted; content type verified server-side
- [ ] Rate limiting in front of `/verify` (it calls paid third-party APIs)
- [ ] HTTPS only
- [ ] API keys restricted at the provider and rotated if ever exposed
- [ ] Dependabot and secret scanning enabled on the repository
- [ ] No personal data in logs; no real user submissions committed
