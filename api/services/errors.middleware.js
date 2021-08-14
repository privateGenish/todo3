class APIError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

function errorHandler(err, req, res, next) {
  function errorMessage() {
    let timeStamp = Math.round(new Date().getTime() / 1000);
    return {
      timeStamp: timeStamp,
      
    };
  }

  if (err instanceof ReferenceError) {
    res.send(400);
    return;
  }

  res.status(500).send();
}

module.exports = errorHandler;
