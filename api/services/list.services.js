const list_controller = require("../controllers/list.controller");

const documentLink = {
  validList: "someLink.com",
};

async function getList(req, res, next) {
  try {
    const { lid } = req.params;
    const item = await list_controller.getPermitedList(lid, res.local.viewerUID);
    if (!item.length) throw APIError.itemNotFound({ lid: lid });
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function createList(req, res, next) {
  try {
    const { list } = req.body;
    if (!list_controller.validateList(list)) {
      throw APIError.typeError(
        "the provided list is not structured correctly, please visit the documents for more information",
        documentLink.validList
      );
    }
    const item = await list_controller.createList(res.local.viewerUID, list);
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function updateList(req, res, next) {
  try {
    const { uid, lid, tasks } = req.body;
    if (!list_controller.validateList(tasks))
      throw APIError.typeError(
        "the provided list is not structured correctly, please visit the documents for more information",
        documentLink.validList
      );
    const item = await list_controller.updateAccessWithPermission(uid, lid, tasks, res.local.viewerUID);
    res.send(item);
  } catch (err) {
    next(err);
  }
}

async function deleteList(req, res, next) {
  try {
    const { uid, lid } = req.body;
    const item = await list_controller.deleteList(uid, lid, res.local.viewerUID);
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function makeListPublic(req, res, next) {
  try {
    const { uid, lid } = req.body;
    const item = await list_controller.makeListPublic(uid, lid, res.local.viewerUID);
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function updateAccess(req, res, next) {
  try {
    const { uid, lid, access } = req.body;
    const item = await list_controller.updateAccessWithPermission(uid, lid, access, res.local.viewerUID);
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

async function updateManagers(req, res, next) {
  try {
    const { uid, lid, managers } = req.body;
    const item = await list_controller.updateManagers(uid, lid, managers, res.local.viewerUID);
    return res.send(item);
  } catch (err) {
    next(err);
  }
}

module.exports = { getList, createList, updateList, deleteList, makeListPublic, updateAccess, updateManagers };
