const apiRouter = require("express").Router();
const userRouter = require("./user.route.js");

apiRouter.use("/user", userRouter);
apiRouter.get("/", (req, res, next) => {
  try {
    return res.send(hello);
  } catch (e) {
    return next(e);
  }
});

module.exports = apiRouter;
