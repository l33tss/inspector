const express = require("express");
const app = express();
const port = 3000;

let users = [
  { id: 1, name: "Alice", age: 25 },
  { id: 2, name: "Bob", age: 30 },
  { id: 3, name: "Charlie", age: 35 },
];

function queryDatabase(sql) {
  const id = Number(sql.split("=")[1].trim());
  return users.find((user) => user.id === id);
}

app.use(express.json());

// Safe endpoint using hardcoded query (no injection possible)
//app.get("/safeUser1", (req, res) => {
//  const result = queryDatabase("SELECT * FROM users WHERE id = 1");
//  res.json(result);
//});
//
//// Using object property directly (unsafe if user can define properties)
//app.get("/user1", (req, res) => {
//  const sql = "SELECT * FROM users WHERE id = " + req.query["id"];
//  const result = queryDatabase(sql);
//  res.json(result);
//})
// //Unsafe due to direct use of query parameter
//app.get("/user2", (req, res) => {
//  const result = queryDatabase(
//    `SELECT * FROM users WHERE name = '${req.query.name}'`
//  );
//  res.json(result);
//});
//
//// Using string concatenation with object property (unsafe)
//app.post("/user3", (req, res) => {
//  const sql = "SELECT * FROM users WHERE id = " + req.body["id"];
//  const result = queryDatabase(sql);
//  res.json(result);
//});
//
//// Using array map (potentially unsafe)
//app.post("/user4", (req, res) => {
//  const sqlParts = ["SELECT * FROM users WHERE name = "].concat(
//    Object.values(req.body).map((v) => `'${v}'`)
//  );
//  const result = queryDatabase(sqlParts.join(", "));
//  res.json(result);
//});
//
//// Using string replacement with multiple placeholders (unsafe)
//app.get("/user5", (req, res) => {
//  const sql = `SELECT * FROM users WHERE age = ? AND name = ?`
//    .replace("?", req.query.age)
//    .replace("?", req.query.name);
//  const result = queryDatabase(sql);
//  res.json(result);
//});
//
//// Safe endpoint using hardcoded query with template string (no injection possible)
//app.get("/safeUser2", (req, res) => {
//  const sql = `SELECT * FROM users WHERE id = ${1}`;
//  const result = queryDatabase(sql);
//  res.json(result);
//});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
