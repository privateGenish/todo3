const userRouter = require("express").Router();
const user_services = require("../services/user.services");

userRouter.get("/:uid", user_services.getUser);
userRouter.delete("/:uid", user_services.deleteUser);
userRouter.put("/:uid", user_services.updateUser);
userRouter.post("/register", user_services.register);
userRouter.post("/thumbnails", user_services.batchGetThumbnails);
userRouter.post("/:uid/likedLists", user_services.batchWriteLikedList);

module.exports = userRouter;
