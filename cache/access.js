const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

sqlite3.verbose();

async function initDB() {
  const db = await open({
    filename: "./cache/cache.db",
    driver: sqlite3.Database,
  });
  db.exec("CREATE TABLE IF NOT EXISTS register_forbidden_access(uid VARCHAR)");
}

initDB();

async function setRegisterDenied(uid) {
  const db = await open({
    filename: "./cache/cache.db",
    driver: sqlite3.Database,
  });

  await db.run("INSERT INTO register_forbidden_access(uid) VALUES(?)", [uid], function (err) {
    console.log("register");
    err ? console.log("set error: " + err) : console.log("inserted");
  });
}
async function releaseRegisterDenied(uid) {
  const db = await open({
    filename: "./cache/cache.db",
    driver: sqlite3.Database,
  });

  await db.run("DELETE FROM register_forbidden_access WHERE uid=?", [uid], function (err) {
    console.log("release");
    err ? console.log("release error: " + err) : console.log("deleted: " + this.changes);
  });
}

async function getRegisterDenied(uid) {
  const db = await open({
    filename: "./cache/cache.db",
    driver: sqlite3.Database,
  });

  const reg = await db.get("SELECT uid FROM register_forbidden_access WHERE uid =?", [uid], function (err) {
    err ? console.log("set error: " + err) : console.log("inserted");
  });
  return reg ? reg.uid : undefined;
}

module.exports = { getRegisterDenied, setRegisterDenied, releaseRegisterDenied };