const { admin } = require("../../config/firebase.config");
const access = require("../../cache/access");

async function readUser(req, res, next) {
  try {
    res.locals.private = false;
    const { authorization } = req.headers || undefined;
    const { uid } = req.params;
    if (authorization != undefined) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authorization);
        if (decodedToken.exp >= Math.floor(new Date().getTime() / 1000) && decodedToken.uid === uid) {
          res.locals.private = true;
        }
      } catch (e) {}
    }
    return next();
  } catch (e) {
    return res.status(500).send({ error: "Internal Server Error" });
  }
}
/**
 * should delete the uid if register is failing.
 */
async function registerUser(req, res, next) {
  var uid;
  try {
    const { authorization } = req.headers || undefined;
    uid = req.body.uid;
    /// Checking if the uid is blacklisted --> throw locked out.
    if (await access.getRegisterDenied(uid)) throw Error("locked out");

    try {
      /// for testing purposes. throwing error in the decode token process.
      if (res.locals.crash_test) throw Error("crash test error");
      const decodedToken = await admin.auth().verifyIdToken(authorization);
      if (decodedToken.exp <= Math.floor(new Date().getTime() / 1000) && decodedToken.uid != uid) {
        ///checking if the token is still valid and not expired.
        throw Error("Access denied");
      }
    } catch (e) {
      throw Error("Access denied");
    }
    return next();
  } catch (e) {
    ///trying to delete the uid from the firebase auth server.
    try {
      //mocking error in the delete uid service.
      if (res.locals.crash_test) throw Error();
      await admin.auth().deleteUser(uid);
    } catch (e) {
      /// if admin.auth().delete fails --> blacklist the uid.
      await access.setRegisterDenied(uid);
    }
    if (e.message == "locked out")
      return res.status(423).send({ error: "Due to server related issues this uid is currently locked from registration" });
    if (e.message == "Access denied") return res.status(401).send({ error: "Access denied" });
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

module.exports = { readUser, registerUser };
