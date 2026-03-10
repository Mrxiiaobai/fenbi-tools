# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fenbi Tools is a VS Code extension that provides a study tool for Chinese civil service exam preparation (公务员考公). The extension integrates with the Fenbi platform (fenbi.com) to deliver practice questions directly within VS Code through a webview interface. It supports both multiple-choice questions (行测/xingce) and essay questions (申论/shenlun).

## Build Commands

```bash
# Development watch mode - run both extension and webview builds
npm run watch

# Watch extension only (TypeScript compilation)
npm run watch:extension

# Watch webview only (webpack React app)
npm run watch:views

# Production build - compile both extension and views
npm run compile

# Package extension as .vsix file
npm run build

# Lint TypeScript files
npm run lint

# Run tests
npm run test
```

## Architecture

### Dual Build System

The project uses two separate build systems:

1. **Extension Code** (`src/*.ts`, excluding `src/views/`)
   - Built with esbuild via `compile:extension` script
   - Entry: `src/extension.ts`
   - Output: `out/extension.js`
   - Target: Node.js/VS Code extension host

2. **Webview Code** (`src/views/**`)
   - Built with webpack + Babel + TypeScript
   - Entry: `src/views/index.tsx`
   - Output: `out/views/main.js`
   - Target: Browser environment (webview)
   - Uses React, React Router, and Ant Design

### Communication Pattern

The extension follows a message-passing architecture between the extension host and webview:

**Extension → Webview:**
```typescript
webview.postMessage({ command: "init", data: {...} })
```

**Webview → Extension:**
```typescript
// From webview
vscode.postMessage({ command: "getQuestion", postData: {...} })

// Handled in extension
webview.onDidReceiveMessage((message) => {
  const { command, postData } = message;
  // Route to appropriate handler
})
```

Key message commands handled by `src/api/webviewHandle.ts`:
- `pageInit` - Initialize extension with categories and cached data
- `getQuestion` - Fetch practice questions by keypoint ID
- `getQuickQuestion` - Fetch random quick practice questions
- `submit` - Submit answers and retrieve solutions
- `answer` - Track study time and increment answer count
- `history` - Retrieve question history
- `changeQuestionCount` - Update user's question count preference

### Key Files

- `src/extension.ts` - Extension activation, registers webview provider
- `src/api/webviewHandle.ts` - Central message router and business logic
- `src/utils/service.ts` - API calls to Fenbi backend
- `src/utils/webview.ts` - Webview lifecycle management and HTML template
- `src/views/app.tsx` - React router setup with 4 main pages (Home, Detail, Answer, History)
- `src/views/components/hooks.tsx` - Settings context provider using VS Code configuration

### API Integration

All API requests go through `src/utils/request.ts` which:
- Reads cookie from VS Code settings (`fenbiTools.cookie`)
- Makes requests to `tiku.fenbi.com` API endpoints
- Handles both JSON and form-urlencoded request formats

The extension requires users to:
1. Log in to fenbi.com
2. Copy their session cookie
3. Paste into VS Code settings under `fenbiTools.cookie`

### State Management

- **Extension State**: Minimal, mostly stateless message handling
- **Webview State**: React context (`SettingProvider`) for VS Code configuration (color, backgroundColor, needLineThrough)
- **Caching**: Uses Fenbi API's built-in cache endpoints (`getCache`) to persist user's selected keypoints

## Development Notes

- TypeScript compilation uses `transpileOnly: true` in webpack for faster builds
- The `src/views/` directory is excluded from main tsconfig.json compilation
- Webview HTML is dynamically generated in `src/utils/func.ts` (`templateHtml` function)
- The extension displays in VS Code's activity bar with a custom fish icon
- Three categories supported: xingce (行测), shenlun (申论), and others defined in API

## Configuration

Users can customize via VS Code settings:
- `fenbiTools.cookie` - Required authentication cookie
- `fenbiTools.color` - Font color (hex value)
- `fenbiTools.backgroundColor` - Background color (hex value)
- `fenbiTools.needLineThrough` - Enable strikethrough button for answer options
