const apiRouter = require("express").Router();
const userRouter = require("./user.route.js");
const listRouter = require("./list.route.js");

apiRouter.use("/user", decodeURI, userRouter);
apiRouter.use("/list", decodeURI, listRouter);
apiRouter.get("/", (req, res, next) => {
  try {
    return res.send(hello);
  } catch (e) {
    return next(e);
  }
});
apiRouter.get("/socket", (req, res, next) => {});

module.exports = apiRouter;
