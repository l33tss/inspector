const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { binCheck, tempCheck, callCheck } = require("./rules");
let warnings = [];

function walkDir(dir, callback, visited = new Set()) {
  fs.readdirSync(dir).forEach((f) => {
    if (f === "node_modules") return;
    let dirPath = path.join(dir, f);
    if (visited.has(dirPath)) return;
    visited.add(dirPath);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback, visited) : callback(dirPath);
  });
}

function checkFileForSQLInjection(filename) {
  let sqlInjectionDetected = false; // Declare locally
  const code = fs.readFileSync(filename, "utf-8");
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "typescript",
      "asyncGenerators",
      "classProperties",
      "dynamicImport",
    ],
  });
  const warnings = checkForPotentialSQLInjection(ast, code);
  if (warnings.length > 0) {
    sqlInjectionDetected = true;
    warnings.forEach((warning) => {
      console.warn(`\x1b[33m${filename}\x1b[0m: ${warning.message}`);
      console.log(warning.line.trim());
      console.log(warning.marker);
    });
    process.exit(1);
  }
}
function addWarning(message, location, injectionPointColumn, code) {
  if (code == undefined) return;
  const lines = code.split("\n");
  const marker = "\x1b[36m^\x1b[0m".padStart(injectionPointColumn + 6, " ");
  const coloredMessage = `\x1b[31m${message}:\x1b[0m`;
  warnings.push({
    message: coloredMessage,
    line: lines[location.start.line - 1],
    marker: marker,
  });
}

function checkForPotentialSQLInjection(ast, code) {
  traverse(ast, {
    BinaryExpression(path) {
      binCheck(path, addWarning, code);
    },
    TemplateLiteral(path) {
      tempCheck(path, addWarning, code);
    },
    CallExpression(path) {
      callCheck(path, addWarning, code);
    },
    MemberExpression(path) {
      //logic
    },
  });

  return warnings;
}
module.exports = {
  walkDir,
  checkFileForSQLInjection,
  checkForPotentialSQLInjection,
  addWarning,
};
