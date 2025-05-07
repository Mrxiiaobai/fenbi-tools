"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateHtml = void 0;
const templateHtml = (scriptUri) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>微博</title>
  </head>
  <body>
    <div id="root"></div>
    <script src=${scriptUri}></script>
  </body>
</html>`;
exports.templateHtml = templateHtml;
//# sourceMappingURL=template.js.map