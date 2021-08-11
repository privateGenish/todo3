console.log("Starting...");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./cache/cache.db");
db.run(
  "CREATE TABLE IF NOT EXISTS register_forbidden_access(uid VARCHAR PRIMARY KEY)"
);

const app = require("./app");
const AWS = require("aws-sdk");
require("dotenv").config();
this.table = process.env.TABLE;

app.listen(3000, () => console.log("listening at http://localhost:3000/api"));
