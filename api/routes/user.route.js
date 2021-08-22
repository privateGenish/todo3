const userRouter = require("express").Router();
const e = require("express");
const auth_middleware = require("../services/auth.middleware");
const response = require("../services/errors.middleware");
const user_services = require("../services/user.services");

userRouter.get("/:uid", auth_middleware.readUser, user_services.getUser);
userRouter.post("/register", auth_middleware.writeUser, user_services.register);
userRouter.post("");

module.exports = userRouter;
