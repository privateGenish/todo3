const apiRouter = require("express").Router();
const userRouter = require("./user.route.js");
const listRouter = require("./list.route.js");
const { decodeUID } = require("../services/auth.middleware.js");

const path = require('path');
apiRouter.use("/user", decodeUID, userRouter);
apiRouter.use("/list", decodeUID, listRouter);
apiRouter.get("/", (req, res, next) => {
  try {
    return res.redirect("https://app.swaggerhub.com/apis-docs/therealgenish/Lysts/1.0.0")
  } catch (e) {
    return next(e);
  }
});
apiRouter.get("/socket", (req, res, next) => {});

module.exports = apiRouter;
