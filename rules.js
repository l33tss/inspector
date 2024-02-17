const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
/**
 * Examines binary expressions for concatenation patterns that could lead to SQL injection.
 * Specifically, it checks for the concatenation of strings that include SQL commands with
 * variables or user inputs, which may not be safely sanitized.
 *
 * @param {NodePath} path The path in the AST to the binary expression node.
 * @param {Function} addWarning A function to call when a potential SQL injection is detected.
 * @param {string} code The entire source code being analyzed.
 * @returns {void} Does not return a value; it invokes `addWarning` if an unsafe pattern is detected.
 */
const binCheck = (path, addWarning, code) => {
  if (path.node.operator === "+") {
    if (
      (path.node.left.type === "StringLiteral" ||
        path.node.left.type === "BinaryExpression") &&
      (path.node.right.type === "Identifier" ||
        path.node.right.type === "MemberExpression" ||
        path.node.right.type === "StringLiteral")
    ) {
      let leftValue = "";
      if (path.node.left.value) {
        leftValue = path.node.left.value.toLowerCase();
      } else {
        leftValue = path.node.left.left.value.toLowerCase();
      }
      const rightValue = path.node.right;
      if (
        (leftValue.includes("select") ||
          leftValue.includes("delete") ||
          leftValue.includes("update")) &&
        leftValue.includes("where") &&
        (rightValue.type == "Identifier" ||
          rightValue.type == "MemberExpression" ||
          (rightValue.type == "StringLiteral" &&
            rightValue.extra.raw.includes("'")))
      ) {
        addWarning(
          "Potential SQL injection detected on line binCheck() " +
            path.node.loc.start.line,
          path.node.loc,
          path.node.right.loc.start.column
        );
      }
    }
  }
};
/**
 * Analyzes a template literal to detect potential SQL injection patterns.
 * It checks if the template literal contains SQL keywords followed by expressions
 * that could lead to SQL injection if they include user-supplied input.
 * If a potential injection is detected, a warning is generated.
 *
 * @param {NodePath} path The path in the AST to the template literal node.
 * @param {Function} addWarning A function to call when a potential SQL injection is detected.
 * @param {string} code The entire source code being analyzed.
 * @returns {void} This function does not return a value; it calls `addWarning` if needed.
 */
const tempCheck = (path, addWarning, code) => {
  const rawParts = path.node.quasis.map((q) => q.value.raw.toLowerCase());
  const expressions = path.get("expressions"); // in TemplateLiteral (``) this is -> ${< whats here >}

  for (let i = 0; i < expressions.length; i++) {
    const expr = expressions[i];
    const exprType = expr.node.type;

    if (
      exprType !== "StringLiteral" &&
      exprType !== "NumericLiteral" &&
      exprType !== "BooleanLiteral"
    ) {
      // Check if any SQL keywords are in the raw parts before and after this expression
      const beforeRaw = rawParts[i] || "";
      const afterRaw = rawParts[i + 1] || "";

      if (
        (beforeRaw.includes("select") || afterRaw.includes("select")) &&
        (beforeRaw.includes("where") || afterRaw.includes("where"))
      ) {
        addWarning(
          "Potential SQL injection detected on line tempCheck() - " +
            expr.node.loc.start.line,
          expr.node.loc,
          expr.node.loc.start.column,
          code
        );
        break;
      }
    }
  }
};

/**
 * Inspects call expressions for unsafe practices that might lead to SQL injection.
 * This includes checking if the call expression passes user input directly into
 * SQL query execution functions, which can be a common vulnerability.
 *
 * @param {NodePath} path The path in the AST to the call expression node.
 * @param {Function} addWarning A function to call when a potential SQL injection is detected.
 * @param {string} code The entire source code being analyzed.
 * @returns {void} Does not return a value; it triggers `addWarning` if a potential issue is found.
 */
const callCheck = (path, addWarning, code) => {
  if (path.node.callee.name == "require" || path.node.callee.name == undefined)
    return;

  for (let arg of path.node.arguments) {
    if (
      (arg && arg.left && arg.type === "Identifier") ||
      arg.type === "BinaryExpression"
    ) {
      if (arg.left == undefined || arg.left.value == undefined) return;
      let actualValue =
        typeof arg.left.value === "string" ? arg.left.value.toLowerCase() : "";

      if (
        actualValue.includes("select") ||
        actualValue.includes("delete") ||
        actualValue.includes("update") ||
        actualValue.includes("where")
      ) {
        addWarning(
          "Potential SQL injection detected on line callCheck() " +
            path.node.loc.start.line,
          path.node.loc,
          path.node.loc.start.column, // -2 to point to the position of `${`
          code
        );
        let binding = path.scope.getBinding(arg.name);

        if (!binding && path.scope.parent) {
          binding = path.scope.parent.getBinding(arg.name);
        }

        if (binding && binding.path.node.init) {
          const initValue = binding.path.node.init;

          // Check if this is a String
          if (initValue.type === "StringLiteral") {
            const actualValue = initValue.value.toLowerCase();
            if (
              actualValue.includes("select") ||
              actualValue.includes("delete") ||
              actualValue.includes("update") ||
              actualValue.includes("where")
            ) {
              addWarning(
                "Potential SQL injection detected on line " +
                  path.node.loc.start.line,
                path.node.loc,
                path.node.loc.start.column,
                code
              );
            }
          }
        }
      }
    }
  }
};

module.exports = {
  binCheck,
  tempCheck,
  callCheck,
};
