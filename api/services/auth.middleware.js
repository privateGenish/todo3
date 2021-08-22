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
  } catch (err) {
    return next(err);
  }
}
async function writeUser(req, res, next) {
  try {
    const { authorization } = req.headers || undefined;
    const { uid } = req.params || req.body;
    const decodedToken = await admin.auth().verifyIdToken(authorization);
    if (decodedToken.exp <= Math.floor(new Date().getTime() / 1000) && decodedToken.uid != uid) throw APIError.forbidden();
    return next();
  } catch (err) {
    return next(err);
  }
}
module.exports = { readUser, writeUser };
