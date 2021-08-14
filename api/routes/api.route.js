const apiRouter = require("express").Router();
const userRouter = require("./user.route.js");

apiRouter.use("/user", userRouter);
apiRouter.get("/", (req, res) => res.send("<h1>TodoApp API</h1>"));

module.exports = apiRouter;
