const listRouter = require("express").Router();
const list_services = require("../services/list.services");

listRouter.get("/:lid", list_services.getList);
listRouter.post("/", list_services.createList);
listRouter.post("/tasks", list_services.updateList);
listRouter.delete("/", list_services.deleteList);
listRouter.post("/public", list_services.makeListPublic);
listRouter.post("/access", list_services.updateAccess);
listRouter.post("/managers", list_services.updateManagers);

module.exports = listRouter;
