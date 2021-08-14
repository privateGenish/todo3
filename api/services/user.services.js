const user_controller = require("../controllers/user.controller");
const { admin } = require("../../config/firebase.config");

async function getUser(req, res) {
  try {
    const { uid } = req.params;
    const private = res.locals.private;
    if (!uid) throw Error("uid not provided");
    if (private) {
      const item = await user_controller.getUser(uid);
      return res.send(item);
    }
    const item = await user_controller.getUserPublicData(uid);
    return res.send(item);
  } catch (e) {
    return res
      .status(500)
      .send({ error: "Internal Server Error", type: "internal error" });
  }
}

async function register(req, res) {
  try {
    const { name, uid, email } = req.body;
    await user_controller.register(uid, name, email);
    return res
      .status(201)
      .send({
        message: `User has created successfully`,
        User: { uid: uid, name: name, email, email },
      });
  } catch (e) {
    if (e.code == "ConditionalCheckFailedException")
      return res.status(405).send({ error: "uid is already exists" });
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    await user_controller.deleteUser(uid);
    await admin.auth().deleteUser(uid);
    return res
      .status(200)
      .send({ message: "User has deleted successfully", User: { uid: uid } });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

module.exports = { getUser, register, deleteUser };
