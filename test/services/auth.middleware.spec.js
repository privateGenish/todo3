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
    before(async () => (this.user = await firebase.signInWithPassword("test@test.com", "11223344")));
    beforeEach(() => (res.locals = { userGetItself: undefined }));
    it("should pass locals.userGetItself = true", async () => {
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
      expect(res.locals.userGetItself).to.be.true;
      expect(next).to.be.calledOnce;
    });
    it('should pass res.local.userGetItself = false, bad uid', async () => {
      const req = {
        headers: {
          authorization: this.token,
        },
        params: { uid: "some_uid" },
      };
      const next = sinon.stub().returns(function () {});
      await auth_middleware.readUser(req, res, next);

      expect(res.locals.userGetItself).to.be.false;
      expect(res.locals.viewerUID).to.be.equal("");
      expect(next).to.be.calledOnce;
    });
    it('should pass res.local.viewerUID = "different", bad uid', async () => {
      this.anotherUser = await firebase.signInWithPassword('getUser@test.com', "11223344");
      const req = {
        headers: {
          authorization: this.anotherUser.idToken,
        },
        params: { uid: this.user.localId },
      };
      const next = sinon.stub().returns(function () {});
      await auth_middleware.readUser(req, res, next);

      expect(res.locals.userGetItself).to.be.false;
      expect(res.locals.viewerUID).to.be.equal(this.anotherUser.localId);
      expect(next).to.be.calledOnce;
    });
  });
  describe(".writeUser", async () => {
    before(async () => {
      this.user = await firebase.signInWithPassword("test@test.com", "11223344");
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
    it("should return next(auth/argument-error)", async () => {
      const req = {
        headers: {},
        params: {},
        body: {},
      };
      const next = sinon.fake();
      const response = await auth_middleware.writeUser(req, res, next);
      expect(next.lastArg.code).to.be.equal("auth/argument-error");
    });
  });
});
