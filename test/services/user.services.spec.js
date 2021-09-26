const chai = require("chai");
const user_service = require("../../api/services/user.services");
const dynamodb = require("../_methods/dynamodb");
const firebase = require("../_methods/firebase");
const sinon = require("sinon");
const expect = chai.expect;
chai.use(require("sinon-chai"));

describe("user.service", () => {
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
  describe(".getUser", () => {
    describe("unitTest", () => {
      before(() => {
        const user_controller = require("../../api/controllers/user.controller");
        this.private = sinon.stub(user_controller, "getUser").returns("private data");
        this.public = sinon.stub(user_controller, "getUserAvailableScope").returns("public data");
      });
      beforeEach(() => {
        res.locals = undefined;
      });
      it("should return private data", async () => {
        res.locals = { userGetItself: true };
        const req = {
          params: {
            uid: "some_uid",
          },
        };

        const response = await user_service.getUser(req, res);
        expect(response).to.be.deep.equal({
          statusCode: 200,
          body: "private data",
        });
        expect(this.private).to.be.calledOnce;
      });
      it("should return public data", async () => {
        res.locals = { userGetItself: "" };
        const req = {
          params: {
            uid: "some_uid",
          },
        };
        const response = await user_service.getUser(req, res);
        expect(response).to.be.deep.equal({
          statusCode: 200,
          body: "public data",
        });
        expect(this.public);
      });
    });
    it("should throw", async () => {
      res.locals = { userGetItself: "" };
      const req = {
        params: {
          uid: "some_uid",
        },
      };
      sinon.stub(this.public).returns([]);
      next = sinon.spy();
      await user_service.getUser(req, res, next);
      expect(next.args[0][0] instanceof APIError).to.be.true;
    });
  });
  describe(".register", () => {
    var next = (args) => console.log(args);
    before(() => {
      this.user = { uid: "registerUID", name: "register", email: "register@test.com" };
    });
    it("should return [201 created]", async () => {
      const req = {
        body: this.user,
      };
      const response = await user_service.register(req, res);
      expect(response).to.be.deep.equals({ statusCode: 201, body: undefined });
    });
    it("should throw APIError.alreadyExists()", async () => {
      const req = {
        body: this.user,
      };
      next = sinon.fake();
      const response = await user_service.register(req, res, next);
      expect(next.lastArg).to.be.deep.equals(APIError.alreadyExists({ uid: this.user.uid }));
    });
    it("should throw APIError.typeError()", async () => {
      req = { body: {} };
      next = sinon.fake();
      await user_service.register(req, res, next);
      expect(next.lastArg).to.be.deep.equal(APIError.typeError("uid", "name"));
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.uid, "USER#" + this.user.uid);
    });
  });
  describe(".deleteUser", function () {
    this.timeout(50000);
    before(async () => {
      this.firebaseUser = await firebase.createUser("service.delete@test.com", "11223344");
      this.user = await dynamodb.createTestItem("USER#" + this.firebaseUser.localId, "USER#" + this.firebaseUser.localId);
    });
    it("should return 200 and delete from firebase and dynamodb", async () => {
      const req = {
        params: {
          uid: this.firebaseUser.localId,
        },
      };
      const response = await user_service.deleteUser(req, res);
      expect(response).to.be.deep.equal({
        statusCode: 200,
        body: undefined,
      });
      await firebase.signInWithPassword("service.delete@test.com", "11223344").catch((e) => expect(e).to.not.be.null);
    });
  });
  describe(".updateUser", () => {
    before(() => {
      const user_controller = require("../../api/controllers/user.controller");
      sinon.stub(user_controller, "updateUser").returns();
    });
    it("should return 200", async () => {
      req = {
        params: "some_uid",
        body: {
          about: "about",
          name: "a name",
        },
      };
      next = (err) => {
        console.log(err);
      };
      const response = await user_service.updateUser(req, res, next);
      expect(response.statusCode).to.be.equal(200);
    });
  });
});
