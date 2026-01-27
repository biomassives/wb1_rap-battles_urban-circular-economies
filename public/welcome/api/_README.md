# Worldbridger API

This directory contains serverless API endpoints used by the Worldbridger network.

## Design principles
- Minimal surface area
- Human-readable logic
- No framework lock-in
- Replaceable persistence layer

## Conventions
- JSON in / JSON out
- Admin access via `x-admin-token`
- No silent failures

## Future extensions
- Magic-link auth
- Email notifications
- Per-group facilitators
- Artifact uploads
