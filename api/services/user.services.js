const user_controller = require("../controllers/user.controller");
const { admin } = require("../../config/firebase.config");

async function getUser(req, res, next) {
  try {
    const { uid } = req.params;
    let item = {};
    item = await user_controller.getUserAvailableScope(uid, res.locals.viewerUID);
    if (!item.length) throw APIError.itemNotFound({ uid: uid });
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { name, uid } = req.body;
    if (typeof uid !== "string" || typeof name !== "string") throw APIError.typeError("uid", "name");
    await user_controller.register(uid, name);
    return res.status(201).send();
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    await user_controller.deleteUser(uid);
    await admin.auth().deleteUser(uid, res.locals.viewerUID);
    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const uid = req.params;
    const { name, about } = req.body;
    if (typeof about !== "string" || typeof name !== "string") throw APIError.typeError("about", "name");
    await user_controller.updateUser({ uid: uid, about: about, name: name }, res.locals.viewerUID);
    return res.status(200).send();
  } catch (err) {
    return next(err);
  }
}

async function batchGetThumbnails(req, res, next) {
  try {
    const uids = req.body.uids;
    if (!Array.isArray(uids)) throw APIError.typeError("uids");
    const response = await user_controller.batchGetUsersInfo(uids);
    res.send(response);
  } catch (err) {
    next(err);
  }
}

async function batchWriteLikedList(req, res, next) {
  try {
    const likedLists = req.body.likedLists;
    const uid = req.params.uid;
    if (res.locals.viewerUID !== uid) throw APIError.unauthorized;
    if (!Array.isArray(likedLists)) throw APIError.typeError("likedLists");
    const response = await user_controller.batchWriteLikedList(uid, likedLists);
    res.send(response);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUser, register, deleteUser, updateUser, batchGetThumbnails, batchWriteLikedList };
