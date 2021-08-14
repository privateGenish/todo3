const userRouter = require("express").Router();
const e = require("express");
const auth_middleware = require("../services/auth.middleware");
const response = require("../services/errors.middleware");
const user_services = require("../services/user.services");


// userRouter.get("/:uid", auth_middleware.readUser, user_services.getUser);

module.exports = userRouter;
