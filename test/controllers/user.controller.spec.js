const user_controller = require("../../api/controllers/user.controller");
const sinon = require("sinon");
const chai = require("chai");
const dynamodb = require("../_methods/dynamodb");
const expect = chai.expect;
chai.use(require("chai-as-promised"));
chai.use(require("chai-subset"));

describe("user.controller", () => {
  afterEach(() => sinon.restore());
  describe(".getUser(uid)", () => {
    describe("integration test dynamodb", () => {
      it("should return all data", async () => {
        const uid = "<TEST>";
        const expectedKeys = ["name", "about", "uid", "title", "listId", "tasks", "access", "managers", "likedLists"];
        const items = await user_controller.getUser(uid);
        items.forEach((element) => expect(expectedKeys).to.include.members(Object.keys(element)));
      });
    });
  });
  describe(".getUserAvailableScope(uid,viewerUID)", () => {
    it("should return only user in access set", async () => {
      const uid = "<TEST>";
      const viewerUID = "<TEST3>";
      const items = await user_controller.getUserAvailableScope(uid, viewerUID);
      var listIds = [];
      items.forEach((element) => listIds.push(element.listId || element.uid));
      expect(listIds).to.containSubset(["<TEST3>"]);
      expect(listIds).to.not.containSubset(["<TEST2>"]);
    });
  });
  describe(".getUserPublicData(uid)", () => {
    describe("integration test dynamodb", () => {
      it("should return only public data", async () => {
        const uid = "<TEST>";
        const notExpectedKeys = ["access"];
        const items = await user_controller.getUserPublicData(uid);
        items.forEach((element) => expect(Object.keys(element)).to.not.include.members(notExpectedKeys));
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
      after(async () => await dynamodb.deleteTestItem("USER#" + this.user.uid, "USER#" + this.user.uid));
    });
  });
  describe(".delete(uid)", function () {
    this.timeout(5000);
    it("should throw APIError.itemNotFound", async () => {
      try {
        const response = await user_controller.deleteUser("noUser");
      } catch (e) {
        expect(e instanceof APIError).to.be.true;
      }
    });
    before(async () => {
      this.user = { localId: "deleteUser" };
      await dynamodb.createTestItem("USER#" + this.user.localId, "USER#" + this.user.localId);
    });
    it("should delete all user related data", async () => {
      await user_controller.deleteUser(this.user.localId);
      const response = await dynamodb.getSingleItem("USER#" + this.user.localId, "USER#" + this.user.localId);
      expect(response).to.be.deep.equal({});
    });
  });
  describe(".updateUser(uid,name,about)", () => {
    before(async () => {
      this.user = { localId: "updateUser" };
      await dynamodb.createTestItem("USER#" + this.user.localId, "USER#" + this.user.localId);
    });
    it("should update name and about", async () => {
      const updates = { about: "updated Text", name: "new name" };
      await user_controller.updateUser({ uid: this.user.localId, about: updates.about, name: updates.name });
      const response = await dynamodb.getSingleItem("USER#" + this.user.localId, "USER#" + this.user.localId);
      expect(response.Item.about).to.be.equal(updates.about);
      expect(response.Item.name).to.be.equal(updates.name);
    });
    it("should update just the name", async () => {
      const updates = { name: "even newer name" };
      await user_controller.updateUser({ uid: this.user.localId, name: updates.name });
      const response = await dynamodb.getSingleItem("USER#" + this.user.localId, "USER#" + this.user.localId);
      expect(response.Item.name).to.be.equal(updates.name);
    });
    it("should update just the about", async () => {
      const updates = { about: "updated text but again" };
      await user_controller.updateUser({ uid: this.user.localId, about: updates.about });
      const response = await dynamodb.getSingleItem("USER#" + this.user.localId, "USER#" + this.user.localId);
      expect(response.Item.about).to.be.equal(updates.about);
    });
    it("should fail", async () => {
      try {
        await user_controller.updateUser({ uid: this.user.localId });
      } catch (e) {
        expect(e instanceof TypeError).to.be.true;
      }
    });
    after(async () => await dynamodb.deleteTestItem("USER#" + this.user.localId, "USER#" + this.user.localId));
  });
  describe(".batchGetUserInfo(uids)", () => {
    before(() => (this.users = ["<TEST>", "<TEST2>", "<TEST3>"]));
    it("should return only name", async () => {
      const response = await user_controller.batchGetUsersInfo(this.users);
    });
  });
  describe(".batchWriteLikedList(uid,likedList)", () => {
    before(() => (this.user = { localId: "<TEST>" }));
    it("should pass", async () => {
      const likedLists = {
        add: ["<TEST>", "<TEST2>"],
        remove: ["<TEST3>"],
      };
      const response = await user_controller.batchWriteLikedList(this.user.localId, likedLists);
      expect(response.likedLists).to.have.members(likedLists.add);
      expect(response.likedLists).to.not.have.members(likedLists.remove);
    });
  });
});
