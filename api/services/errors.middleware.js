class APIError {
  constructor(status, message) {
    this.status = status;
    this.message = message;
  }
  static itemNotFound(item = { "": "" }) {
    return new APIError(200, "The request was successful, yet there are no record of this item " + JSON.stringify(item));
  }
  static alreadyExists(item = { item: "." }) {
    return new APIError(200, "The request was accepted, yet this item already exists " + JSON.stringify(item));
  }
  static typeError(...args) {
    return new APIError(400, "Required arguments are not provided or was wrongly provided.\nArguments: " + args);
  }
  static forbidden() {
    return new APIError(403, {
      details:
        "The provided authorization token was valid but did not granted an access to this route.\nEither you are sending an expired token or trying to preform operation that are not available to your permissions scope",
    });
  }
  static unauthorized() {
    return new APIError(401, "The provided token could not be verified");
  }
}

global.APIError = APIError;

function errorHandler(err, req, res, next) {
  function errorMessage({ status = 500, error, info = "No additional info" } = {}) {
    if (!error && status == 200) status += " OK";
    if (!error && status == 400) error = "Client Error";
    if (!error && status == 401) error = "Unauthorized";
    if (!error && status == 403) {
      error = "Forbidden";
      info.path = req.path;
    }
    if (!error && status == 404) error = "Not Found";
    if (!error && status == 500) error = "Internal Server Error";
    let timeStamp = Math.round(new Date().getTime() / 1000);
    return {
      TimeStamp: timeStamp,
      Status: status,
      Error: error,
      Info: info,
    };
  }
  if (err.code == "auth/invalid-token" || err.code == "auth/argument-error") {
    err = APIError.unauthorized();
  }

  if (err.message == "The conditional request failed") {
    let msg = errorMessage({ status: 403 });
    return res.status(msg.Status).send(msg);
  }

  if (err instanceof APIError) {
    let msg = errorMessage({ status: err.status, info: err.message });
    return res.status(err.status).send(msg);
  }

  let msg = errorMessage();
  console.log("err: " + err + "\nmsg: " + msg.Status);
  return res.status(msg.Status).send(msg);
}

module.exports = errorHandler;
