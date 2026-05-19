# self-hosting memorywalk

this guide walks through running your own instance. detailed steps will be added in phase 11.

## overview

1. fork the repository
2. edit `site.config.ts` with your instance name, tagline, and URLs
3. set up a GitHub OAuth app for Decap CMS authentication
4. deploy the Cloudflare Worker OAuth proxy (see `oauth-proxy/`)
5. configure curator handles in `curators.json`
6. deploy the site to any static hosting provider
7. (optional) configure IPFS pinning — set `ipfs.enabled: true` in `site.config.ts`

## what changes in one file

`site.config.ts` contains all instance-specific configuration: name, tagline, epigraph, URLs, and feature flags. a fork should run with its own identity by editing this single file.

## detailed setup

coming in phase 11.
