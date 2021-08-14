const auth_middleware = require("../../api/services/auth.middleware");
const sinon = require("sinon");
const firebase = require("../_methods/firebase");
const chai = require("chai");

const access = require("../../cache/access");

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
    it("should return error[500]", async () => {
      const req = {
        headers: {
          authorization: this.token,
        },
        params: {
          uid: "cihRZfdoynd5qSMLIUFuqUAuPZg1",
        },
      };

      //test: injecting an error
      const next = function () {
        throw Error();
      };

      const response = await auth_middleware.readUser(req, res, next);
      expect(response).to.be.deep.equal({
        statusCode: 500,
        body: {
          error: "Internal Server Error",
        },
      });
    });
  });
  describe(".registerUser", () => {
    before(async () => {
      this.suitePassed = false;
      this.user = await firebase.createUser(
        "registerUser@test.com",
        "test1234"
      );
    });
    beforeEach(async () => {
      res.locals = { crash_test: undefined };
      await access.releaseRegisterDenied(this.user.localId);
    });
    afterEach(() => sinon.restore());
    after(async () => {
      if (!this.suitePassed) await firebase.deleteUser(this.user.idToken);
    });
    it("should return lock", async () => {
      res.locals = { crash_test: true };
      const req = {
        headers: {
          authorization: this.user.IdToken,
        },
        body: {
          uid: this.user.localId,
        },
      };
      const next = sinon.stub().callsFake(() => {
        return "next";
      });
      await auth_middleware.registerUser(req, res, next);
      const response = await auth_middleware.registerUser(req, res, next);
      expect(response).to.contain({
        statusCode: 423,
      });
      expect(next).to.be.callCount(0);
    });
    it("should next()", async () => {
      const req = {
        headers: {
          authorization: this.user.idToken,
        },
        body: {
          uid: this.user.localId,
        },
      };
      const next = sinon.stub().callsFake(() => {
        return "next";
      });
      const response = await auth_middleware.registerUser(req, res, next);
      expect(response).to.be.equal("next");
      expect(next).to.be.calledOnce;
    });
    it("should return access denied 401", async () => {
      const req = {
        headers: {
          authorization: undefined,
        },
        body: {
          uid: this.user.localId,
        },
      };
      const next = sinon.stub().callsFake(() => {
        return "next";
      });
      const response = await auth_middleware.registerUser(req, res, next);
      expect(response).to.be.deep.equals({
        statusCode: 401,
        body: {
          error: "Access denied",
        },
      });
      this.suitePassed = true;
    });
  });
  describe(".writeUser", async () => {
    before(async () => {
      this.user = await firebase.signInWithPassword(
        "test@test.com",
        "11223344"
      );
    });
    it("should pass done()", async () => {
      const req = {
        headers: {
          authorization: this.user.idToken,
        },
        params: {
          uid: this.user.localId,
        },
      };
      const next = sinon.stub().callsFake(function () {});
      await auth_middleware.writeUser(req, res, next);
      expect(next).to.be.calledOnce;
    });
    it("should return 400", async () => {
      const req = {
        headers: {},
      };
      const next = sinon.stub().returns(function () {});
      const response = await auth_middleware.writeUser(req, res, next);
      expect(response).to.be.deep.equal({
        statusCode: 400,
        body: {
          error: "Bad request",
        },
      });
    });
    it("should return error[500]", async () => {
      const req = {
        headers: {
          authorization: this.user.idToken,
        },
        params: {
          uid: this.user.localId,
        },
      };

      //test: injecting an error
      const next = function () {
        throw Error();
      };

      const response = await auth_middleware.writeUser(req, res, next);
      expect(response).to.be.deep.equal({
        statusCode: 500,
        body: {
          error: "Internal Server Error",
        },
      });
    });
  });
});
