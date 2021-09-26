const chai = require("chai");
const expect = chai.expect;
const list_controller = require("../../api/controllers/list.controller");
const dynamodb = require("../_methods/dynamodb");
const { validate } = require("uuid");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");

describe.only("list.controller", () => {
  describe(".validateList(list)", () => {
    it("should be valid and return true", () => {
      const validList = {
        title: "title",
        tasks: [
          {
            done: false,
            taskTitle: "do a test thing",
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      expect(list_controller.validateList(validList)).to.be.true;
    });
    it("should return false due to bad types", () => {
      const badBooleanList = {
        title: "title",
        tasks: [
          {
            done: "false",
            taskTitle: "do a test thing",
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      //done is a not a boolean
      expect(list_controller.validateList(badBooleanList)).to.be.false;

      const badTaskTitleList = {
        title: "title",
        tasks: [
          {
            done: false,
            taskTitle: 123456,
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      //task title is not a string
      expect(list_controller.validateList(badTaskTitleList)).to.be.false;
    });
    it("should return false because the list is to nested", () => {
      const tooNestedList = {
        title: "title",
        tasks: [
          {
            done: false,
            taskTitle: "123456",
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
                nestedTasks: [
                  {
                    done: false,
                    taskTitle: "too nested task",
                  },
                ],
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      expect(list_controller.validateList(tooNestedList)).to.be.false;
    });
  });
  describe(".getList(lid)", () => {
    before(async () => {
      this.user = { localId: "<PUBLIC>" };
    });
    it("should validate if keys exist", async () => {
      const item = await list_controller.getList(this.user.localId);
      const expectedKeys = ["lid", "title", "tasks", "uid"];
      expect(expectedKeys).to.include.members(Object.keys(item));
    });
    it("should return empty", async () => {
      const item = await list_controller.getList("not_exist");
      expect(item).to.be.an("array").that.is.empty;
    });
  });
  describe(".getPermitedList(lid,viewerUID) & .makeListPublic", () => {
    before(async () => {
      this.user = { localId: "<some_uid>" };
      this.otherUser = { localId: "<other_uid>" };
      const list = { title: "some list", access: ["USER#" + this.otherUser.localId], managers: ["USER#<manager>"] };
      const response = await list_controller.createList(this.user.localId, list);
      this.user.lid = response.lid;
    });
    it("should allow to see it", async () => {
      const response = await list_controller.getPermitedList(this.user.lid, this.user.localId);
      expect(response).not.to.be.empty;
    });
    it("shouldn't allow to see it", async () => {
      const response = await list_controller.getPermitedList(this.user.lid, "public_uid");
      expect(response).to.be.empty;
    });
    it("should be public now", async () => {
      await list_controller.makeListPublic(this.user.localId, this.user.lid);
      const response = await list_controller.getPermitedList(this.user.lid);
      expect(response).to.not.be.empty;
    });
  });
  describe(".createList(uid, list)", () => {
    before(() => {
      this.user = { localId: "<some_uid>" };
    });
    it("validate lid uniqueness and put request to past", async () => {
      const validList = {
        title: "title",
        tasks: [
          {
            done: false,
            taskTitle: "do a test thing",
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      const response = await list_controller.createList(this.user.localId, validList);
      this.user.lid = response.lid;
      expect(validate(lid)).to.be.true;
    });
    it("creates list without content", async () => {
      const validList = undefined;
      const response = await list_controller.createList(this.user.localId, validList);
      this.user.anotherLid = response.lid;
      expect(validate(lid)).to.be.true;
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.anotherLid);
    });
  });
  describe.skip(".updateList(uid,lid,list)", () => {
    before(async () => {
      this.user = { localId: "<some_uid>" };
      this.otherUser = { localId: "<other_uid>" };
      const list = { title: "some list", managers: ["USER#" + this.otherUser.localId] };
      const response = await list_controller.createList(this.user.localId, list);
      this.user.lid = response.lid;
    });
    it("should update", async () => {
      const updatedValues = {
        title: "really nigga?",
        tasks: [
          {
            done: false,
            taskTitle: "someTask",
          },
        ],
      };
      const response = await list_controller.updateList(this.user.localId, this.user.lid, updatedValues);
      expect(response.tasks).not.be.deep.equal([]);
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
    });
  });
  describe(".updateListWithPermission(uid,lid,list,viewerUID)", () => {
    before(async () => {
      this.user = { localId: "<some_uid>" };
      this.otherUser = { localId: "<other_uid>" };
      const list = { title: "some list", managers: ["USER#" + this.otherUser.localId] };
      const response = await list_controller.createList(this.user.localId, list);
      this.user.lid = response.lid;
    });
    it.only("should allow and update the list", async () => {
      const updatedValues = {
        title: "really nigga?",
        tasks: [
          {
            done: false,
            taskTitle: "someTask",
          },
        ],
      };
      const response = await list_controller.updateListWithPermission(
        this.user.localId,
        this.user.lid,
        updatedValues,
        this.user.localId
      );
      expect(response.tasks).not.be.deep.equal([]);

    });
    it("should not allow to update the item", async () => {
      const updatedValues = {
        title: "really nigga?",
        tasks: [
          {
            done: false,
            taskTitle: "someTask",
          },
        ],
      };
      try {
        await list_controller.updateListWithPermission(this.user.localId, this.user.lid, updatedValues, "not_allowed");
      } catch (err) {
        expect(err.message).to.be.equal("The conditional request failed");
      }
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
    });
  });
  describe(".updateAccessWithPermission", () => {
    before(async () => {
      this.user = { localId: "<some_uid>" };
      this.otherUser = { localId: "<other_uid>" };
      const list = {
        title: "some list",
        managers: new DocumentClient().createSet(["USER#" + this.otherUser.localId, "USER#<can_see>"]),
      };
      const response = await list_controller.createList(this.user.localId, list);
      this.user.lid = response.lid;
    });
    it("should pass", async () => {
      const accessList = ["<can_see>"];
      const response = await list_controller.updateAccessWithPermission(
        this.user.localId,
        this.user.lid,
        accessList,
        this.otherUser.localId
      );
      expect(response.access).to.be.deep.equal(accessList);
      expect(response.manager).not.to.containSubset(accessList);
    });
    it("should catch condition error", async () => {
      const accessList = ["<can_see>"];
      try {
        const response = await list_controller.updateAccessWithPermission(
          this.user.localId,
          this.user.lid,
          accessList,
          "not_allowed"
        );
      } catch (err) {
        expect(err.message).to.be.equal("The conditional request failed");
      }
    });
    it.skip("updateAccess should pass", async () => {
      const accessList = ["<can_see>", "<can_watch>", this.otherUser.localId];
      const response = await list_controller.updateAccess(this.user.localId, this.user.lid, accessList);
      expect(response.access).to.be.deep.equal(accessList);
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
    });
  });
  describe(".updateManagers", () => {
    before(async () => {
      this.user = { localId: "<some_uid>" };
      const list = { title: "some list", access: new DocumentClient().createSet(["USER#<can_manage>"]) };
      const response = await list_controller.createList(this.user.localId, list);
      console.log(response);
      this.user.lid = response.lid;
    });
    it("should pass", async () => {
      const managersList = ["<can_manage>"];
      const response = await list_controller.updateManagers(this.user.localId, this.user.lid, managersList, this.user.localId);
      expect(response.managers).to.be.deep.equal(managersList);
      expect(response.access).to.not.be.containSubset(managersList);
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
    });
  });
  describe(".rewriteList(uid, lid, list)", () => {
    before(async () => {
      this.user = { localId: "<some_uid>", lid: "" };
      const response = await list_controller.createList(this.user.localId);
      this.user.lid = response.lid;
    });
    it("should update", async () => {
      const validList = {
        title: "title",
        tasks: [
          {
            done: false,
            taskTitle: "do a test thing",
          },
          {
            done: false,
            taskTitle: "do nested things",
            nestedTasks: [
              {
                done: true,
                taskTitle: "a nested Task",
              },
              {
                done: false,
                taskTitle: "another nestedTask",
              },
            ],
          },
        ],
      };
      const response = await list_controller.rewriteList(this.user.localId, this.user.lid, validList);
      expect(response.item).to.be.deep.equal(validList);
    });
    after(async () => {
      await dynamodb.deleteTestItem("USER#" + this.user.localId, "LIST#" + this.user.lid);
    });
  });
  describe(".deleteList(uid,lid)", () => {
    before(async () => {
      this.user = { localId: "<some_uid>", lid: "" };
      const response = await list_controller.createList(this.user.localId);
      this.user.lid = response.lid;
      expect(response).to.not.be.empty;
    });
    it("should pass", async () => {
      await list_controller.deleteList(this.user.localId, this.user.lid);
      const response = await dynamodb.getSingleItem(this.user.localId, this.user.lid);
      expect(response).to.be.deep.empty;
    });
  });
});
