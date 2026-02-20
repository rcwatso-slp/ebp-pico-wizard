# EBP Wizard: PICO -> Elicit -> Plan

Static React app for SLP student clinicians to complete a locked evidence-based practice workflow and export a print-ready PDF packet.

## Features

- Locked progression from Step 0 through Step 6.
- Required field validation per step.
- Step 4 Top Articles enforcement (min 3, max 5).
- Step 5 extraction completion checks.
- Step 6 goal/objective/method/progress/rationale requirements.
- PHI safety banner + non-blocking pattern warnings (date-like or likely name patterns).
- Per-field "Ignore warning" checkbox.
- Autosave to `localStorage` on each change with save feedback.
- Reset button clears saved data and restarts wizard.
- Export route at `#/export` with print stylesheet for PDF output.
- GitHub Pages deploy workflow on push to `main`.

## Tech

- React + TypeScript + Vite
- React Router (`HashRouter`) for GitHub Pages compatibility
- Plain CSS (responsive two-column desktop + mobile accordion tips)

## Local Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview built app:

```bash
npm run preview
```

## GitHub Pages Deployment

This repo includes `.github/workflows/deploy.yml` using official Pages actions:

- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

### Base Path Configuration

Vite reads `VITE_BASE_PATH` in `vite.config.ts`.

- Local dev defaults to `/`.
- Workflow sets `VITE_BASE_PATH=/<REPO_NAME>/` automatically.

For manual production build matching project pages:

```bash
VITE_BASE_PATH=/your-repo-name/ npm run build
```

Then publish with GitHub Pages project site:

`https://<USERNAME>.github.io/<REPO>/`

## Privacy Note

Do not enter PHI in the app. It is client-side only and stores data in the current browser's `localStorage`.
