import * as React from "react";
import { getVscodeApi } from "../utils/vscodeApi";

type DisguiseMode = "vscode";

interface DisguiseContextValue {
  disguiseEnabled: boolean;
  activeMode: DisguiseMode | null;
  startDisguise: () => void;
  enableDisguise: (mode: DisguiseMode) => void;
  disableDisguise: () => void;
}

const DisguiseContext = React.createContext<DisguiseContextValue>({
  disguiseEnabled: false,
  activeMode: null,
  startDisguise: () => undefined,
  enableDisguise: () => undefined,
  disableDisguise: () => undefined,
});

export const useDisguise = () => React.useContext(DisguiseContext);

const STORAGE_KEY = "fenbi-disguise-state";
const vscode = getVscodeApi();

interface StoredState {
  enabled: boolean;
  mode: DisguiseMode | null;
}

const readInitialState = (): StoredState => {
  try {
    const state = vscode.getState?.() as
      | { [STORAGE_KEY]?: StoredState }
      | undefined;
    return state?.[STORAGE_KEY] ?? { enabled: false, mode: null };
  } catch {
    return { enabled: false, mode: null };
  }
};

const writeState = (state: StoredState) => {
  try {
    const prev = (vscode.getState?.() as Record<string, unknown>) || {};
    vscode.setState?.({ ...prev, [STORAGE_KEY]: state });
  } catch {
    // ignore
  }
};

type CodeToken = {
  text: string;
  className?: string;
};

type CodeLine = CodeToken[];

type TreeNode = {
  name: string;
  type: "folder" | "file";
  badge?: string;
  status?: "M" | "U" | "A" | "D";
  open?: boolean;
  language?: string;
  children?: TreeNode[];
};

const k = (text: string, className?: string): CodeToken => ({ text, className });
const c = (text: string): CodeLine => [k(text, "disguise-code-comment")];
const blank = (): CodeLine => [k(" ")];

const homeTsx: CodeLine[] = [
  c("// frontend-service - Home page"),
  [k("import", "disguise-code-keyword"), k(" "), k("React", "disguise-code-variable"), k(" "), k("from", "disguise-code-keyword"), k(" "), k("\"react\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("useEffect", "disguise-code-variable"), k(", "), k("useState", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"react\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" "), k("axios", "disguise-code-variable"), k(" "), k("from", "disguise-code-keyword"), k(" "), k("\"axios\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("useAuth", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"@/hooks/useAuth\"", "disguise-code-string"), k(";")],
  blank(),
  [k("interface", "disguise-code-keyword"), k(" "), k("HomeProps", "disguise-code-tag"), k(" {")],
  [k("  "), k("userId", "disguise-code-variable"), k("?: "), k("string", "disguise-code-tag"), k(";")],
  [k("  "), k("onLoaded", "disguise-code-variable"), k("?: () => "), k("void", "disguise-code-tag"), k(";")],
  [k("}", "disguise-code-keyword")],
  blank(),
  [k("export const", "disguise-code-keyword"), k(" "), k("Home", "disguise-code-function"), k(" = ("), k("userId", "disguise-code-variable"), k(", "), k("onLoaded", "disguise-code-variable"), k(": "), k("HomeProps", "disguise-code-tag"), k(") => {")],
  [k("  "), k("const", "disguise-code-keyword"), k(" ["), k("data", "disguise-code-variable"), k(", "), k("setData", "disguise-code-variable"), k("] = "), k("useState", "disguise-code-function"), k("<"), k("any", "disguise-code-tag"), k(">("), k("null", "disguise-code-keyword"), k(");")],
  [k("  "), k("const", "disguise-code-keyword"), k(" { "), k("user", "disguise-code-variable"), k(" } = "), k("useAuth", "disguise-code-function"), k("();")],
  blank(),
  [k("  "), k("useEffect", "disguise-code-function"), k("(() => {")],
  [k("    "), k("if", "disguise-code-keyword"), k(" (!"), k("userId", "disguise-code-variable"), k(") "), k("return", "disguise-code-keyword"), k(";")],
  [k("    "), k("axios", "disguise-code-function"), k("."), k("get", "disguise-code-function"), k("("), k("\"/api/users/\"", "disguise-code-string"), k(" + "), k("userId", "disguise-code-variable"), k(")."), k("then", "disguise-code-function"), k("(("), k("res", "disguise-code-variable"), k(") => {")],
  [k("      "), k("setData", "disguise-code-function"), k("("), k("res", "disguise-code-variable"), k("."), k("data", "disguise-code-variable"), k(");")],
  [k("      "), k("onLoaded", "disguise-code-variable"), k("?.();")],
  [k("    });", "disguise-code-keyword")],
  [k("  }, [userId]);", "disguise-code-keyword")],
  blank(),
  [k("  "), k("if", "disguise-code-keyword"), k(" (!"), k("data", "disguise-code-variable"), k(") "), k("return", "disguise-code-keyword"), k(" <"), k("Spinner", "disguise-code-tag"), k(" />;")],
  blank(),
  [k("  "), k("return", "disguise-code-keyword"), k(" (")],
  [k("    <"), k("div", "disguise-code-tag"), k(" "), k("className", "disguise-code-variable"), k("="), k("\"home-page\"", "disguise-code-string"), k(">")],
  [k("      <"), k("Header", "disguise-code-tag"), k(" "), k("user", "disguise-code-variable"), k("={user} />")],
  [k("      <"), k("main", "disguise-code-tag"), k("><"), k("Card", "disguise-code-tag"), k(">{"), k("data", "disguise-code-variable"), k("."), k("name", "disguise-code-variable"), k("}</"), k("Card", "disguise-code-tag"), k("></"), k("main", "disguise-code-tag"), k(">")],
  [k("    </div>", "disguise-code-keyword")],
  [k("  );", "disguise-code-keyword")],
  [k("};", "disguise-code-keyword")],
];

const appTsx: CodeLine[] = [
  c("// frontend-service - Application root"),
  [k("import", "disguise-code-keyword"), k(" "), k("React", "disguise-code-variable"), k(" "), k("from", "disguise-code-keyword"), k(" "), k("\"react\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("BrowserRouter", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"react-router-dom\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("Home", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"@/pages/Home\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("Dashboard", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"@/pages/Dashboard\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("AuthProvider", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"@/store/auth\"", "disguise-code-string"), k(";")],
  blank(),
  [k("export const", "disguise-code-keyword"), k(" "), k("App", "disguise-code-function"), k(" = () => {")],
  [k("  "), k("return", "disguise-code-keyword"), k(" (")],
  [k("    <"), k("AuthProvider", "disguise-code-tag"), k(">")],
  [k("      <"), k("BrowserRouter", "disguise-code-tag"), k(">")],
  [k("        <"), k("Routes", "disguise-code-tag"), k(">")],
  [k("          <"), k("Route", "disguise-code-tag"), k(" "), k("path", "disguise-code-variable"), k("="), k("\"/\"", "disguise-code-string"), k(" "), k("element", "disguise-code-variable"), k("={<"), k("Home", "disguise-code-tag"), k(" />} />")],
  [k("          <"), k("Route", "disguise-code-tag"), k(" "), k("path", "disguise-code-variable"), k("="), k("\"/dashboard\"", "disguise-code-string"), k(" "), k("element", "disguise-code-variable"), k("={<"), k("Dashboard", "disguise-code-tag"), k(" />} />")],
  [k("        </"), k("Routes", "disguise-code-tag"), k(">")],
  [k("      </"), k("BrowserRouter", "disguise-code-tag"), k(">")],
  [k("    </"), k("AuthProvider", "disguise-code-tag"), k(">")],
  [k("  );", "disguise-code-keyword")],
  [k("};", "disguise-code-keyword")],
];

const useAuthTs: CodeLine[] = [
  c("// frontend-service - Auth hook"),
  [k("import", "disguise-code-keyword"), k(" { "), k("useContext", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"react\"", "disguise-code-string"), k(";")],
  [k("import", "disguise-code-keyword"), k(" { "), k("AuthContext", "disguise-code-variable"), k(" } "), k("from", "disguise-code-keyword"), k(" "), k("\"@/store/auth\"", "disguise-code-string"), k(";")],
  blank(),
  [k("export const", "disguise-code-keyword"), k(" "), k("useAuth", "disguise-code-function"), k(" = () => {")],
  [k("  "), k("const", "disguise-code-keyword"), k(" ctx = "), k("useContext", "disguise-code-function"), k("("), k("AuthContext", "disguise-code-variable"), k(");")],
  [k("  "), k("if", "disguise-code-keyword"), k(" (!ctx) "), k("throw", "disguise-code-keyword"), k(" "), k("new", "disguise-code-keyword"), k(" "), k("Error", "disguise-code-function"), k("("), k("\"useAuth must be used within AuthProvider\"", "disguise-code-string"), k(");")],
  [k("  "), k("return", "disguise-code-keyword"), k(" ctx;")],
  [k("};", "disguise-code-keyword")],
];

const requestTs: CodeLine[] = [
  c("// frontend-service - HTTP client"),
  [k("import", "disguise-code-keyword"), k(" "), k("axios", "disguise-code-variable"), k(" "), k("from", "disguise-code-keyword"), k(" "), k("\"axios\"", "disguise-code-string"), k(";")],
  blank(),
  [k("const", "disguise-code-keyword"), k(" "), k("instance", "disguise-code-variable"), k(" = "), k("axios", "disguise-code-variable"), k("."), k("create", "disguise-code-function"), k("({")],
  [k("  "), k("baseURL", "disguise-code-variable"), k(": "), k("process", "disguise-code-variable"), k("."), k("env", "disguise-code-variable"), k("."), k("REACT_APP_API_URL", "disguise-code-variable"), k(",")],
  [k("  "), k("timeout", "disguise-code-variable"), k(": "), k("10000", "disguise-code-string"), k(",")],
  [k("});", "disguise-code-keyword")],
  blank(),
  [k("instance", "disguise-code-variable"), k("."), k("interceptors", "disguise-code-variable"), k("."), k("request", "disguise-code-variable"), k("."), k("use", "disguise-code-function"), k("(("), k("config", "disguise-code-variable"), k(") => {")],
  [k("  "), k("const", "disguise-code-keyword"), k(" "), k("token", "disguise-code-variable"), k(" = "), k("localStorage", "disguise-code-variable"), k("."), k("getItem", "disguise-code-function"), k("("), k("\"token\"", "disguise-code-string"), k(");")],
  [k("  "), k("if", "disguise-code-keyword"), k(" ("), k("token", "disguise-code-variable"), k(") {")],
  [k("    "), k("config", "disguise-code-variable"), k("."), k("headers", "disguise-code-variable"), k("."), k("Authorization", "disguise-code-variable"), k(" = "), k("`Bearer ${token}`", "disguise-code-string"), k(";")],
  [k("  }", "disguise-code-keyword")],
  [k("  "), k("return", "disguise-code-keyword"), k(" "), k("config", "disguise-code-variable"), k(";")],
  [k("});", "disguise-code-keyword")],
  blank(),
  [k("export", "disguise-code-keyword"), k(" "), k("default", "disguise-code-keyword"), k(" "), k("instance", "disguise-code-variable"), k(";")],
];

const packageJson: CodeLine[] = [
  [k("{", "disguise-code-keyword")],
  [k("  "), k("\"name\"", "disguise-code-string"), k(": "), k("\"frontend-service\"", "disguise-code-string"), k(",")],
  [k("  "), k("\"version\"", "disguise-code-string"), k(": "), k("\"1.4.2\"", "disguise-code-string"), k(",")],
  [k("  "), k("\"private\"", "disguise-code-string"), k(": "), k("true", "disguise-code-keyword"), k(",")],
  [k("  "), k("\"scripts\"", "disguise-code-string"), k(": {")],
  [k("    "), k("\"dev\"", "disguise-code-string"), k(": "), k("\"vite\"", "disguise-code-string"), k(",")],
  [k("    "), k("\"build\"", "disguise-code-string"), k(": "), k("\"tsc && vite build\"", "disguise-code-string"), k(",")],
  [k("    "), k("\"test\"", "disguise-code-string"), k(": "), k("\"jest\"", "disguise-code-string")],
  [k("  }", "disguise-code-keyword"), k(",")],
  [k("  "), k("\"dependencies\"", "disguise-code-string"), k(": {")],
  [k("    "), k("\"react\"", "disguise-code-string"), k(": "), k("\"^18.2.0\"", "disguise-code-string"), k(",")],
  [k("    "), k("\"react-dom\"", "disguise-code-string"), k(": "), k("\"^18.2.0\"", "disguise-code-string"), k(",")],
  [k("    "), k("\"react-router-dom\"", "disguise-code-string"), k(": "), k("\"^6.20.0\"", "disguise-code-string"), k(",")],
  [k("    "), k("\"axios\"", "disguise-code-string"), k(": "), k("\"^1.6.0\"", "disguise-code-string")],
  [k("  }", "disguise-code-keyword")],
  [k("}", "disguise-code-keyword")],
];

const readmeMd: CodeLine[] = [
  [k("# frontend-service", "disguise-code-keyword")],
  blank(),
  [k("Internal admin dashboard for the platform team.", "disguise-code-comment")],
  blank(),
  [k("## Getting started", "disguise-code-keyword")],
  blank(),
  [k("```bash", "disguise-code-string")],
  [k("npm install", "disguise-code-function")],
  [k("npm run dev", "disguise-code-function")],
  [k("```", "disguise-code-string")],
  blank(),
  [k("## Scripts", "disguise-code-keyword")],
  blank(),
  [k("- "), k("`npm run dev`", "disguise-code-string"), k(" - start dev server")],
  [k("- "), k("`npm run build`", "disguise-code-string"), k(" - production build")],
  [k("- "), k("`npm test`", "disguise-code-string"), k(" - run unit tests")],
];

const fileContentMap: Record<string, { language: string; lines: CodeLine[]; path: string[] }> = {
  "Home.tsx": { language: "TypeScript React", lines: homeTsx, path: ["src", "pages", "Home.tsx"] },
  "App.tsx": { language: "TypeScript React", lines: appTsx, path: ["src", "App.tsx"] },
  "useAuth.ts": { language: "TypeScript", lines: useAuthTs, path: ["src", "hooks", "useAuth.ts"] },
  "request.ts": { language: "TypeScript", lines: requestTs, path: ["src", "services", "request.ts"] },
  "package.json": { language: "JSON", lines: packageJson, path: ["package.json"] },
  "README.md": { language: "Markdown", lines: readmeMd, path: ["README.md"] },
};

const projectTree: TreeNode[] = [
  {
    name: ".vscode",
    type: "folder",
    children: [
      { name: "settings.json", type: "file" },
      { name: "extensions.json", type: "file" },
      { name: "launch.json", type: "file" },
    ],
  },
  {
    name: ".github",
    type: "folder",
    children: [
      {
        name: "workflows",
        type: "folder",
        children: [
          { name: "ci.yml", type: "file" },
          { name: "deploy.yml", type: "file" },
        ],
      },
      { name: "CODEOWNERS", type: "file" },
      { name: "PULL_REQUEST_TEMPLATE.md", type: "file" },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file" },
      { name: "index.html", type: "file" },
      { name: "robots.txt", type: "file" },
      {
        name: "assets",
        type: "folder",
        children: [
          { name: "logo.svg", type: "file" },
          { name: "empty.png", type: "file", badge: "1.2k" },
        ],
      },
    ],
  },
  {
    name: "docs",
    type: "folder",
    children: [
      { name: "README.md", type: "file" },
      { name: "ARCHITECTURE.md", type: "file" },
      { name: "CHANGELOG.md", type: "file", status: "M" },
      { name: "CONTRIBUTING.md", type: "file" },
    ],
  },
  {
    name: "scripts",
    type: "folder",
    children: [
      { name: "build.ts", type: "file" },
      { name: "deploy.ts", type: "file" },
      { name: "release.ts", type: "file", status: "M" },
    ],
  },
  {
    name: "src",
    type: "folder",
    open: true,
    children: [
      {
        name: "components",
        type: "folder",
        open: true,
        children: [
          { name: "Button.tsx", type: "file", status: "M" },
          { name: "Card.tsx", type: "file" },
          { name: "Modal.tsx", type: "file" },
          { name: "Input.tsx", type: "file" },
          { name: "Avatar.tsx", type: "file" },
          { name: "Tabs.tsx", type: "file" },
          {
            name: "__tests__",
            type: "folder",
            children: [
              { name: "Button.test.tsx", type: "file" },
              { name: "Modal.test.tsx", type: "file", badge: "✓" },
            ],
          },
        ],
      },
      {
        name: "pages",
        type: "folder",
        open: true,
        children: [
          { name: "Home.tsx", type: "file" },
          { name: "Login.tsx", type: "file" },
          { name: "Dashboard.tsx", type: "file", status: "M" },
          { name: "Settings.tsx", type: "file" },
          { name: "NotFound.tsx", type: "file" },
        ],
      },
      {
        name: "hooks",
        type: "folder",
        children: [
          { name: "useAuth.ts", type: "file" },
          { name: "useFetch.ts", type: "file" },
          { name: "useDebounce.ts", type: "file", status: "U" },
          { name: "useLocalStorage.ts", type: "file" },
        ],
      },
      {
        name: "store",
        type: "folder",
        children: [
          { name: "index.ts", type: "file" },
          { name: "userSlice.ts", type: "file", status: "M" },
          { name: "cartSlice.ts", type: "file" },
        ],
      },
      {
        name: "services",
        type: "folder",
        children: [
          { name: "request.ts", type: "file" },
          { name: "auth.ts", type: "file" },
          { name: "order.ts", type: "file", status: "M" },
        ],
      },
      {
        name: "utils",
        type: "folder",
        children: [
          { name: "format.ts", type: "file" },
          { name: "storage.ts", type: "file" },
          { name: "constants.ts", type: "file" },
          { name: "helpers.ts", type: "file", status: "U" },
        ],
      },
      {
        name: "styles",
        type: "folder",
        children: [
          { name: "global.css", type: "file" },
          { name: "variables.less", type: "file", status: "M" },
          { name: "mixins.less", type: "file" },
        ],
      },
      {
        name: "types",
        type: "folder",
        children: [
          { name: "index.ts", type: "file" },
          { name: "api.d.ts", type: "file" },
          { name: "global.d.ts", type: "file" },
        ],
      },
      {
        name: "router",
        type: "folder",
        children: [
          { name: "index.tsx", type: "file", status: "M" },
          { name: "routes.ts", type: "file" },
        ],
      },
      { name: "App.tsx", type: "file", status: "M" },
      { name: "main.tsx", type: "file" },
      { name: "vite-env.d.ts", type: "file" },
    ],
  },
  {
    name: "tests",
    type: "folder",
    children: [
      { name: "setup.ts", type: "file" },
      { name: "e2e.spec.ts", type: "file", badge: "e2e" },
    ],
  },
  {
    name: "node_modules",
    type: "folder",
    badge: "1.2k",
    children: [
      {
        name: "react",
        type: "folder",
        children: [{ name: "index.js", type: "file" }],
      },
      {
        name: "react-dom",
        type: "folder",
        children: [{ name: "index.js", type: "file" }],
      },
    ],
  },
  {
    name: "dist",
    type: "folder",
    badge: "build",
    children: [
      { name: "bundle.js", type: "file", badge: "412k" },
      { name: "index.html", type: "file" },
    ],
  },
  { name: ".env", type: "file", badge: "local" },
  { name: ".env.example", type: "file" },
  { name: ".eslintrc.cjs", type: "file" },
  { name: ".prettierrc", type: "file" },
  { name: ".gitignore", type: "file" },
  { name: "package.json", type: "file", status: "M" },
  { name: "package-lock.json", type: "file", badge: "328k" },
  { name: "tsconfig.json", type: "file" },
  { name: "vite.config.ts", type: "file" },
  { name: "README.md", type: "file" },
  { name: "LICENSE", type: "file" },
];

const fileIconColor = (name: string): string => {
  if (name.endsWith(".tsx")) return "#519aba";
  if (name.endsWith(".ts")) return "#519aba";
  if (name.endsWith(".css") || name.endsWith(".less")) return "#519aba";
  if (name.endsWith(".json")) return "#cbcb41";
  if (name.endsWith(".md")) return "#519aba";
  if (name.endsWith(".html")) return "#e34c26";
  if (name.endsWith(".svg")) return "#ffb13b";
  if (name.endsWith(".yml") || name.endsWith(".yaml")) return "#519aba";
  if (name.startsWith(".env")) return "#e37900";
  return "#999";
};

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    className="disguise-tree-chevron"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
  >
    <path d="M6 4 L10 8 L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FolderIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" className="disguise-tree-folder-icon">
    {open ? (
      <path d="M1 4 L1 13 L15 13 L15 5 L7 5 L5 3 L1 3 Z M1 6 L15 6" fill="#dcb67a" stroke="#b5895a" strokeWidth="0.5" />
    ) : (
      <path d="M1 4 L1 13 L15 13 L15 5 L7 5 L5 3 L1 3 Z" fill="#dcb67a" stroke="#b5895a" strokeWidth="0.5" />
    )}
  </svg>
);

const FileIcon: React.FC<{ name: string }> = ({ name }) => {
  const color = fileIconColor(name);
  if (name.endsWith(".tsx") || name.endsWith(".ts")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" className="disguise-tree-file-icon">
        <rect x="2" y="2" width="12" height="12" rx="1" fill={color} opacity="0.15" />
        <text x="8" y="11" textAnchor="middle" fontSize="7" fill={color} fontWeight="700">TS</text>
      </svg>
    );
  }
  if (name.endsWith(".json")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" className="disguise-tree-file-icon">
        <rect x="2" y="2" width="12" height="12" rx="1" fill={color} opacity="0.15" />
        <text x="8" y="11" textAnchor="middle" fontSize="6" fill={color} fontWeight="700">{"{}"}</text>
      </svg>
    );
  }
  if (name.endsWith(".md")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" className="disguise-tree-file-icon">
        <rect x="2" y="2" width="12" height="12" rx="1" fill={color} opacity="0.15" />
        <text x="8" y="11" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">M</text>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="disguise-tree-file-icon">
      <rect x="3" y="2" width="10" height="12" rx="1" fill={color} opacity="0.2" />
    </svg>
  );
};

const statusColor = (status: TreeNode["status"]) => {
  if (status === "M") return "#e2c08d";
  if (status === "U") return "#73c991";
  if (status === "A") return "#73c991";
  if (status === "D") return "#f48771";
  return "#888";
};

interface TreeContextValue {
  activeFile: string | null;
  setActiveFile: (name: string) => void;
}

const TreeContext = React.createContext<TreeContextValue>({
  activeFile: null,
  setActiveFile: () => undefined,
});

const DisguiseTree: React.FC<{ node: TreeNode; depth: number }> = ({
  node,
  depth,
}) => {
  const [open, setOpen] = React.useState(Boolean(node.open));
  const { activeFile, setActiveFile } = React.useContext(TreeContext);

  const handleFileClick = React.useCallback(() => {
    if (node.type === "file") {
      setActiveFile(node.name);
    }
  }, [node, setActiveFile]);

  if (node.type === "file") {
    const isActive = activeFile === node.name;
    const hasContent = Boolean(fileContentMap[node.name]);
    return (
      <div
        className={`disguise-tree-row${isActive ? " disguise-tree-row-active" : ""}${!hasContent ? " disguise-tree-row-dim" : ""}`}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={hasContent ? handleFileClick : undefined}
        role={hasContent ? "button" : undefined}
        tabIndex={hasContent ? 0 : -1}
      >
        {depth > 0 && <span className="disguise-tree-indent" />}
        <FileIcon name={node.name} />
        <span className="disguise-tree-label">{node.name}</span>
        {node.status && (
          <span
            className="disguise-tree-status"
            style={{ color: statusColor(node.status) }}
            title={node.status}
          >
            {node.status}
          </span>
        )}
        {node.badge && <span className="disguise-tree-badge">{node.badge}</span>}
      </div>
    );
  }

  return (
    <div>
      <div
        className="disguise-tree-row disguise-tree-row-folder"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        role="button"
        tabIndex={0}
      >
        {depth > 0 && <span className="disguise-tree-indent" />}
        <ChevronIcon open={open} />
        <span className="disguise-tree-label disguise-tree-folder-label">{node.name}</span>
        {node.status && (
          <span
            className="disguise-tree-status"
            style={{ color: statusColor(node.status) }}
            title={node.status}
          >
            {node.status}
          </span>
        )}
        {node.badge && <span className="disguise-tree-badge">{node.badge}</span>}
      </div>
      {open && node.children && (
        <div>
          {node.children.map((child) => (
            <DisguiseTree
              key={child.name}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TabItem {
  name: string;
  dirty?: boolean;
}

const DisguiseOverlay: React.FC = () => {
  const { disguiseEnabled, disableDisguise } = useDisguise();
  const [activeFile, setActiveFile] = React.useState<string>("Home.tsx");
  const [tabs, setTabs] = React.useState<TabItem[]>([
    { name: "Home.tsx" },
    { name: "App.tsx", dirty: true },
    { name: "Dashboard.tsx", dirty: true },
    { name: "README.md" },
    { name: "package.json" },
  ]);
  const [activeTab, setActiveTab] = React.useState<string>("Home.tsx");
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    if (!disguiseEnabled) return;
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, [disguiseEnabled]);

  React.useEffect(() => {
    if (!disguiseEnabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") disableDisguise();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disguiseEnabled, disableDisguise]);

  if (!disguiseEnabled) return null;

  const current = fileContentMap[activeFile] ?? fileContentMap["Home.tsx"];
  const currentPath = current.path;

  const handleFileSelect = (name: string) => {
    if (!fileContentMap[name]) return;
    setActiveFile(name);
    setActiveTab(name);
    setTabs((prev) => {
      if (prev.some((t) => t.name === name)) return prev;
      return [...prev, { name }];
    });
  };

  const handleTabSelect = (name: string) => {
    setActiveTab(name);
    setActiveFile(name);
  };

  const handleCloseTab = (name: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.name !== name);
      if (activeTab === name && next.length > 0) {
        const fallback = next[next.length - 1];
        setActiveTab(fallback.name);
        setActiveFile(fallback.name);
      }
      return next;
    });
  };

  const timeStr = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const treeContextValue: TreeContextValue = {
    activeFile,
    setActiveFile: handleFileSelect,
  };

  return (
    <div className="disguise-overlay" onClick={disableDisguise}>
      <div className="disguise-sidebar">
        <div className="disguise-sidebar-section">
          <div className="disguise-sidebar-header">
            <span>资源管理器</span>
          </div>
        </div>
        <div className="disguise-sidebar-section">
          <div className="disguise-project-title">
            <ChevronIcon open={true} />
            <span>frontend-service</span>
          </div>
          <div className="disguise-tree">
            <TreeContext.Provider value={treeContextValue}>
              {projectTree.map((node) => (
                <DisguiseTree key={node.name} node={node} depth={0} />
              ))}
            </TreeContext.Provider>
          </div>
        </div>
      </div>
      <div className="disguise-main">
        <div className="disguise-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className={`disguise-tab${activeTab === tab.name ? " disguise-tab-active" : ""}${tab.dirty ? " disguise-tab-dirty" : ""}`}
              onClick={() => handleTabSelect(tab.name)}
              role="button"
              tabIndex={0}
            >
              <FileIcon name={tab.name} />
              <span className="disguise-tab-label">{tab.name}</span>
              <button
                type="button"
                className="disguise-tab-close"
                onClick={() => handleCloseTab(tab.name)}
                aria-label="关闭标签"
              >
                {tab.dirty ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
        <div className="disguise-breadcrumb">
          <span>frontend-service</span>
          {currentPath.map((part, idx) => (
            <React.Fragment key={part}>
              <span className="disguise-breadcrumb-sep">›</span>
              <span className={idx === currentPath.length - 1 ? "disguise-breadcrumb-current" : ""}>{part}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="disguise-editor">
          {current.lines.map((line, idx) => (
            <div className="disguise-line" key={idx}>
              <span className="disguise-line-number">{idx + 1}</span>
              <span className="disguise-line-content">
                {line.map((token, i) => (
                  <span key={i} className={token.className}>{token.text}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="disguise-statusbar">
          <div className="disguise-statusbar-left">
            <span className="disguise-statusbar-branch">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1" />
                <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1" />
                <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1" />
                <path d="M4 6 L4 8 L8 12 L12 8 L12 6" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
              main
            </span>
            <span className="disguise-statusbar-sep">|</span>
            <span>2 modifications</span>
            <span className="disguise-statusbar-sep">|</span>
            <span>0 errors</span>
            <span>0 warnings</span>
          </div>
          <div className="disguise-statusbar-right">
            <span>Ln {current.lines.length}</span>
            <span>Col 1</span>
            <span>UTF-8</span>
            <span>LF</span>
            <span>{current.language}</span>
            <span>{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DisguiseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initial = readInitialState();
  const [disguiseEnabled, setDisguiseEnabled] = React.useState(initial.enabled);
  const [activeMode, setActiveMode] = React.useState<DisguiseMode | null>(
    initial.mode,
  );

  const enableDisguise = React.useCallback((mode: DisguiseMode) => {
    setDisguiseEnabled(true);
    setActiveMode(mode);
    writeState({ enabled: true, mode });
  }, []);

  const disableDisguise = React.useCallback(() => {
    setDisguiseEnabled(false);
    setActiveMode(null);
    writeState({ enabled: false, mode: null });
  }, []);

  const startDisguise = React.useCallback(() => {
    if (disguiseEnabled) {
      disableDisguise();
    } else {
      enableDisguise("vscode");
    }
  }, [disguiseEnabled, enableDisguise, disableDisguise]);

  const value = React.useMemo(
    () => ({
      disguiseEnabled,
      activeMode,
      startDisguise,
      enableDisguise,
      disableDisguise,
    }),
    [
      disguiseEnabled,
      activeMode,
      startDisguise,
      enableDisguise,
      disableDisguise,
    ],
  );

  return (
    <DisguiseContext.Provider value={value}>
      {children}
      <DisguiseOverlay />
    </DisguiseContext.Provider>
  );
};
