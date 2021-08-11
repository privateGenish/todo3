const auth_middleware = require("../../api/services/auth.middleware");
const sinon = require("sinon");
const firebase = require("../_methods/firebase");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));

describe("auth.middleware", () => {
  const res = {
    send: (obj) => {
      return {
        statusCode: 200,
        body: obj,
      };
    },
    status: (status) => {
      return {
        send: (obj) => {
          return {
            statusCode: status,
            body: obj,
          };
        },
      };
    },
  };

  describe(".readUser", function () {
    this.timeout(5000);
    before(
      async () =>
        (this.user = await firebase.signInWithPassword(
          "test@test.com",
          "11223344"
        ))
    );
    beforeEach(() => (res.locals = { private: undefined }));
    it("should pass locals.private = true", async () => {
      const req = {
        headers: {
          authorization: this.user.idToken,
        },
        params: {
          uid: this.user.localId,
        },
      };
      const next = sinon.stub().returns(function () {});
      await auth_middleware.readUser(req, res, next);
      expect(res.locals.private).to.be.true;
      expect(next).to.be.calledOnce;
    });
    it("should pass res.local.private = false, bad uid", async () => {
      const req = {
        headers: {
          authorization: this.token,
        },
        params: { uid: "some_uid" },
      };
      const next = sinon.stub().returns(function () {});
      await auth_middleware.readUser(req, res, next);

      expect(res.locals.private).to.be.false;
      expect(next).to.be.calledOnce;
    });
  });
});
