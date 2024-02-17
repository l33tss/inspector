const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { exec } = require("child_process");
const {
  walkDir,
  checkFileForSQLInjection,
  checkForPotentialSQLInjection,
  addWarning,
} = require("./sqlInjectionDetection");
sqlInjectionDetected = false;

console.log(`

\x1b[32m  _____                           _                  \x1b[0m
\x1b[32m |_   _|                         | |                  \x1b[0m
\x1b[32m   | |  _ __  ___ _ __   ___  ___| |_ ___  _ __       \x1b[0m
\x1b[32m   | | | '_ \\/ __| '_ \\ / _ \\/ __| __/ _ \\| '__|   \x1b[0m
\x1b[32m  _| |_| | | \\__ \\ |_) |  __/ (__| || (_) | |         \x1b[0m
\x1b[32m |_____|_| |_|___/ .__/ \\___|\\___|\\__\\___/|_|       \x1b[0m
\x1b[32m                 | |                                \x1b[0m
\x1b[32m                 |_|                            \x1b[0m

  \x1b[34m          +-++-++-++-++-++-+ +-++-++-++-+\x1b[0m
  \x1b[34m          |A||p||p||S||e||c| |T||e||a||m|\x1b[0m
  \x1b[34m          +-++-++-++-++-++-+ +-++-++-++-+\x1b[0m
`);

walkDir(".", (filename) => {
  if (
    filename.endsWith(".js") &&
    !filename.includes(path.basename(__filename)) &&
    !filename.includes("rules.js") &&
    !filename.includes("sqlInjectionDetection.js")
  ) {
    checkFileForSQLInjection(filename);
  }
});
