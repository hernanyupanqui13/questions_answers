// Registers the @/ path alias at runtime for the compiled production server.
// Loaded via `node -r ./dist/src/register-paths.js dist/server.js`
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleAlias = require("module-alias");
const path = require("path");

moduleAlias.addAlias("@", path.join(__dirname, ".."));
