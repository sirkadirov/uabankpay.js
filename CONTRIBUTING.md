# Contributing to UABankPay

Thank you for considering a contribution! This document describes how to set up the project
and submit your changes.

## Development setup

The project requires [Node.js](https://nodejs.org/) 16 or newer. Install dependencies with:

```bash
npm install
```

## Project conventions

- The library is written in TypeScript and published as ESM (`"type": "module"`) to both
  [npm](https://www.npmjs.com/package/@sirkadirov/uabankpay) and [JSR](https://jsr.io/@sirkadirov/uabankpay).
- Use `.js` extensions in relative imports (required by `NodeNext` module resolution).
- Keep runtime code free of Node-specific APIs - the library must also run in browsers,
  Deno, Bun and web workers.
- Public behavior changes should come with tests in `src/UaBankPayProvider.test.ts`.
- Versions in `package.json` and `jsr.json` must always match; CI enforces this before publishing.

## Building and testing

```bash
npm run typecheck   # Run the TypeScript compiler in check-only mode
npm run build       # Compile to dist/
npm test            # Run the test suite
```

Please make sure all three commands pass before submitting a pull request.

## Submitting changes

1. Fork the repository and create a feature branch.
2. Make your changes with tests.
3. Open a pull request against `main` describing what changed and why.

For security-sensitive issues, please follow the responsible disclosure process described in
[SECURITY.md](SECURITY.md) instead of opening a public issue.
