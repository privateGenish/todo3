const app = require("express")();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const errorHandler = require("./api/services/errors.middleware");
const apiRouter = require("./api/routes/api.route");

app.use("/api", apiRouter);
app.use("*", (req, res) => res.status(404).send());

app.use(errorHandler);
module.exports = app;
