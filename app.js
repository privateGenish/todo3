const app = require("express")();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const errorHandler = require("./api/services/errors.middleware");
app.use(errorHandler);

const apiRouter = require("./api/routes/api.route");
app.use("*", (req, res) => res.status(404).send());
app.use("/api", apiRouter);

module.exports = app;
