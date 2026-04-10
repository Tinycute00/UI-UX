# Ta Chen PMIS Static Frontend

This is a maintainable, Vite-based static frontend project for the Ta Chen PMIS application. 
The CSS and JavaScript have been extracted from a single standalone HTML prototype and modularized.

## Development

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.
Push the project to the `main` branch, then enable **GitHub Pages** with **GitHub Actions** as the source.
The workflow will build the Vite app and publish the `dist/` output automatically.

## Structure
- `index.html`: Root HTML template. Assembles the app from `@include` partials during Vite dev/build.
- `src/partials/`: App shell, views, mobile chrome, and modal partials for team collaboration.
- `src/main.js`: Main JavaScript entry point. Imports styles and modules, exposes needed globals.
- `src/styles/`: Contains stylesheets (`main.css`).
- `src/js/`: Contains modularized JavaScript logic (`navigation.js`, `modals.js`, `safety.js`, `data-setters.js`).

## Code Quality

Run lint and formatting checks:

```bash
npm run lint
npm run format:check
```

Auto-fix where possible:

```bash
npm run lint:fix
npm run format
```

## CI

GitHub Actions now runs:

- `npm run lint`
- `npm run format:check`
- `npm run build`

on pushes to `main` and on pull requests.
