const { admin } = require("../../config/firebase.config");

async function readUser(req, res, next) {
  try {
    res.locals.private = false;
    const { authorization } = req.headers || undefined;
    const { uid } = req.params;
    if (authorization != undefined) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authorization);
        if (
          decodedToken.exp >= Math.floor(new Date().getTime() / 1000) &&
          decodedToken.uid === uid
        ) {
          res.locals.private = true;
        }
      } catch (e) {}
    }
    return next();
  } catch (e) {
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

module.exports = { readUser };
