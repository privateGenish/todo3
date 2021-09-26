const { admin } = require("../../config/firebase.config");

async function decodeUID(req, res, next) {
  try {
    res.locals.viewerUID = "";
    const { authorization } = req.headers || undefined;
    if (authorization != undefined) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authorization);
        res.locals.viewerUID = decodedToken.uid;
      } catch (e) {}
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

async function readUser(req, res, next) {
  try {
    res.locals.userGetItself = false;
    res.locals.viewerUID = "";
    const { authorization } = req.headers || undefined;
    const { uid } = req.params || "";
    if (authorization != undefined) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authorization);
        if (decodedToken.exp >= Math.floor(new Date().getTime() / 1000) && decodedToken.uid === uid) {
          res.locals.userGetItself = true;
        } else {
          res.locals.viewerUID = decodedToken.uid;
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

module.exports = { readUser, writeUser, decodeUID };
