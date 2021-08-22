const user_controller = require("../controllers/user.controller");
const { admin } = require("../../config/firebase.config");
const access = require("../../cache/access");

async function getUser(req, res, next) {
  try {
    const { uid } = req.params;
    let item = {};
    if (res.locals.private) {
      item = await user_controller.getUser(uid);
    } else {
      item = await user_controller.getUserPublicData(uid);
      item.Info = "Due to the given authorization parameters the response only exposes public data";
    }
    if (JSON.stringify(item) === "{}") throw APIError.itemNotFound({ uid: uid });
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { name, uid, email } = req.body;
    if (typeof uid !== "string" && typeof name !== "string" && typeof email !== "string")
      throw APIError.typeError("uid", "name", "email");
    await user_controller.register(uid, name, email);
    return res.status(201).send();
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    await user_controller.deleteUser(uid);
    await admin.auth().deleteUser(uid);
    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getUser, register, deleteUser };
