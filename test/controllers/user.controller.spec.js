const user_controller = require("../../api/controllers/user.controller");
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const chai = require("chai");
const firebase = require("../_methods/firebase");
const dynamodb = require("../_methods/dynamodb");
const expect = chai.expect;
chai.use(require("chai-as-promised"));
describe("user.controller", () => {
  afterEach(() => sinon.restore());
  describe(".getUser(uid)", () => {
    describe("unit test", () => {
      before(() => {
        this.promiseStub = sinon.stub();
        this.DocumentClientStub = sinon.stub().callsFake(() => {
          return {
            get: sinon.stub().returnsThis(),
            promise: this.promiseStub,
          };
        });
        this.proxy_user_controller = proxyquire("../../api/controllers/user.controller", {
          "aws-sdk/clients/dynamodb": {
            DocumentClient: this.DocumentClientStub,
          },
        });
      });
      beforeEach(() => {
        this.promiseStub.returns(undefined);
      });
      it("should return mocked value", async () => {
        this.promiseStub.returns({ Item: { data: "someData" } });
        expect(await this.proxy_user_controller.getUser("someuid")).to.be.deep.equal({
          Item: {
            data: "someData",
          },
        });
      });
      it('should throw TypeError("uid not a string")', async () => {
        const uid = 1234;
        try {
          await this.proxy_user_controller.getUser(uid);
        } catch (e) {
          expect(e.message).to.be.equal("uid is not a string");
          expect(e instanceof TypeError).to.be.true;
        }
      });
    });
    describe("integration test dynamodb", () => {
      it("should return all data", async () => {
        const uid = "<UID>";
        const expectedItem = {
          Item: {
            Lists: {
              public: ["LIST#<LID1>", "LIST#<LID2>"],
              private: ["LIST#<LID3>"],
            },
            About: "@the.real.genish",
            PK: "USER#<UID>",
            LikedLists: ["LIST#<LID3>"],
            Name: "TRG",
            Email: "test@test.com",
          },
        };
        const item = await user_controller.getUser(uid);
        expect(item).to.be.deep.equals(expectedItem);
      });
    });
  });
  describe(".getUserPublicData(uid)", () => {
    describe("unit test", () => {
      before(() => {
        this.promiseStub = sinon.stub();
        this.DocumentClientStub = sinon.stub().callsFake(() => {
          return {
            get: sinon.stub().returnsThis(),
            promise: this.promiseStub,
          };
        });
        this.proxy_user_controller = proxyquire("../../api/controllers/user.controller", {
          "aws-sdk/clients/dynamodb": {
            DocumentClient: this.DocumentClientStub,
          },
        });
      });
      beforeEach(() => {
        this.promiseStub.returns(undefined);
      });
      it("should return mocked value", async () => {
        this.promiseStub.returns({ Item: { data: "somePublicData" } });
        expect(await this.proxy_user_controller.getUserPublicData("someuid")).to.be.deep.equal({
          Item: {
            data: "somePublicData",
          },
        });
      });
      it('should throw TypeError("uid not a string")', async () => {
        const uid = 1234;
        try {
          await this.proxy_user_controller.getUserPublicData(uid);
        } catch (e) {
          expect(e.message).to.be.equal("uid is not a string");
          expect(e instanceof TypeError).to.be.true;
        }
      });
    });
    describe("integration test dynamodb", () => {
      it("should return only public data", async () => {
        const uid = "<UID>";
        const expectedItem = {
          Item: {
            Lists: {
              public: ["LIST#<LID1>", "LIST#<LID2>"],
            },
            About: "@the.real.genish",
            Name: "TRG",
          },
        };
        const item = await user_controller.getUserPublicData(uid);
        expect(item).to.be.deep.equals(expectedItem);
      });
    });
  });
  describe(".register(uid,name,email)", async () => {
    describe("integration test", async () => {
      before(() => {
        this.user = {
          uid: "registerUID",
          name: "register",
          email: "register@test.com",
        };
      });
      it("should return {}", async () => {
        const response = await user_controller.register(this.user.uid, this.user.name, this.user.name);
        expect(response).to.be.deep.equal({});
      });
      it("should throw", async () => {
        try {
          await user_controller.register(this.user.uid, this.user.name, this.user.name);
        } catch (e) {
          expect(e.message).to.be.equal(APIError.alreadyExists({ uid: this.user.uid }).message);
        }
      });
      after(async () => await dynamodb.deleteTestItem("USER#" + this.user.uid));
    });
  });
  describe(".delete(uid)", () => {
    it("should throw APIError.itemNotFound", async () => {
      try {
        const response = await user_controller.deleteUser("noUser");
      } catch (e) {
        expect(e instanceof APIError).to.be.true;
      }
    });
    before(async () => {
      this.user = { uid: "deleteUser" };
      await dynamodb.createTestItem("USER#" + this.user.uid);
    });
    it("should send 200 OK", async () => {
      const response = await user_controller.deleteUser(this.user.uid);
      expect(response).to.be.deep.equal({});
    });
  });
});
