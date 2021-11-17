const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const cred = require("../../config/aws-credentials");
const { v4: uuidv4 } = require("uuid");
const client = new DocumentClient(cred);
const table = process.env.TABLE;
const GSI1 = "GSI";

function validateList(list) {
  const maxNest = 2;
  if (list == undefined) return true;
  const validateTask = (task, nest) => {
    if (nest >= maxNest) return false;
    for (const key in task) {
      switch (key) {
        case "done":
          if (typeof task.done !== "boolean") return false;
          break;
        case "taskTitle":
          if (typeof task.taskTitle !== "string") return false;
          break;
        case "nestedTasks":
          if (!Array.isArray(task.nestedTasks)) return false;
          nest++;
          for (let index = 0; index < task.nestedTasks.length; index++) {
            const element = task.nestedTasks[index];
            if (!validateTask(element, nest)) return false;
          }
          break;
        default:
          return false;
      }
    }
    return true;
  };
  for (const key in list) {
    switch (key) {
      case "title":
        if (typeof list.title !== "string") return false;
        break;
      case "tasks":
        if (!Array.isArray(list.tasks)) return false;
        for (let index = 0; index < list.tasks.length; index++) {
          const element = list.tasks[index];
          if (!validateTask(element, 0)) return false;
        }
        break;
      default:
        return false;
    }
  }
  return true;
}

//deprecated
async function getList(lid) {
  const opts = {
    TableName: table,
    IndexName: GSI1,
    KeyConditionExpression: "SK = :lid",
    ExpressionAttributeValues: { ":lid": "LIST#" + lid },
  };
  var item = await client.query(opts).promise();
  if (item.Items.length) {
    item = item.Items[0];
    item.uid = item.PK.substring(5);
    item.lid = item.SK.substring(5);
    delete item.PK;
    delete item.SK;
    return item;
  }
  return item.Items;
}

async function getPermitedList(lid, viewerUID) {
  const opts = {
    TableName: table,
    IndexName: GSI1,
    FilterExpression: "contains(#a, :vu) OR contains(#m, :vu) OR attribute_not_exists(access) OR #o = :vu",
    ExpressionAttributeNames: {
      "#m": "managers",
      "#a": "access",
      "#o": "owner",
    },
    KeyConditionExpression: "SK = :lid",
    ExpressionAttributeValues: { ":lid": "LIST#" + lid, ":vu": "USER#" + viewerUID },
  };
  var item = await client.query(opts).promise();
  if (item.Items.length) {
    item = item.Items[0];
    item.uid = item.PK.substring(5);
    item.lid = item.SK.substring(5);
    delete item.PK;
    delete item.SK;
    delete item.owner;
    if (item.access) item.access = Array.from(item.access, (x) => x.substring(5));
    if (item.managers) item.managers = Array.from(item.managers, (x) => x.substring(5));
    return item;
  }
  return item.Items;
}

async function makeListPublic(uid, lid, viewerUID) {
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK) AND PK = :vu",
    ExpressionAttributeValues: { ":vu": "USER#" + viewerUID },
    UpdateExpression: "REMOVE access",
  };
  const item = await client.update(opts).promise();
  return item;
}

async function createList(uid, list) {
  lid = uuidv4();
  const opts = {
    TableName: table,
    Item: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_not_exists(PK) and attribute_not_exists(SK) ",
  };
  list.owner = "USER#" + uid;
  for (var key in list) {
    opts.Item[key] = list[key];
  }
  await client.put(opts).promise();
  return await getList(lid);
}

//use this function with care, this is a problematic approach to update.
async function rewriteList(uid, lid, item) {
  const opts = {
    TableName: table,
    Item: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
      item,
    },
  };
  await client.put(opts).promise();
  return await getList(lid);
}

//deprecated
async function updateList(uid, lid, list) {
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK)",
    UpdateExpression: "SET #l = :l, #t = :t",
    ExpressionAttributeNames: {
      "#l": "tasks",
      "#t": "title",
    },
    ExpressionAttributeValues: {
      ":l": list.tasks,
      ":t": list.title,
    },
    ReturnValues: "ALL_NEW",
  };
  var item = await client.update(opts).promise();
  item = item.Attributes;
  item.uid = item.PK.substring(5);
  item.lid = item.SK.substring(5);
  delete item.PK;
  delete item.SK;
  return item;
}

async function updateListWithPermission(uid, lid, list, viewerUID) {
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK) AND (contains(managers, :vu) OR PK = :vu)",
    UpdateExpression: "SET #l = :l, #t = :t",
    ExpressionAttributeNames: {
      "#l": "tasks",
      "#t": "title",
    },
    ExpressionAttributeValues: {
      ":l": list.tasks,
      ":t": list.title,
      ":vu": "USER#" + viewerUID,
    },
    ReturnValues: "ALL_NEW",
  };
  var item = await client.update(opts).promise();
  item = item.Attributes;
  item.uid = item.PK.substring(5);
  item.lid = item.SK.substring(5);
  delete item.PK;
  delete item.SK;
  return item;
}

//deprecated
async function updateAccess(uid, lid, accessList) {
  const accessSet = Array.from(accessList, (item) => "USER#" + item);
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK) ",
    UpdateExpression: "SET #a = :a DELETE #m :a",
    ExpressionAttributeNames: {
      "#a": "access",
      "#m": "managers",
    },
    ExpressionAttributeValues: {
      ":a": client.createSet(accessSet),
    },
    ReturnValues: "UPDATED_NEW",
  };
  var item = await client.update(opts).promise();
  const access = item.Attributes.access ? item.Attributes.access.values : [];
  const managers = item.Attributes.managers ? item.Attributes.managers.values : [];
  item = {
    access: Array.from(access, (x) => x.substring(5)),
    managers: Array.from(managers, (x) => x.substring(5)),
  };
  item.uid = uid;
  item.lid = lid;
  return item;
}

async function updateAccessWithPermission(uid, lid, accessList, viewerUID) {
  const accessSet = Array.from(accessList, (item) => (item != viewerUID ? "USER#" + item : null));
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK) AND (contains(managers, :vu) OR PK = :vu)",
    UpdateExpression: "SET #a = :a DELETE #m :a ",
    ExpressionAttributeNames: {
      "#a": "access",
      "#m": "managers",
    },
    ExpressionAttributeValues: {
      ":a": client.createSet(accessSet),
      ":vu": "USER#" + viewerUID,
    },
    ReturnValues: "UPDATED_NEW",
  };
  var item = await client.update(opts).promise();
  const access = item.Attributes.access ? item.Attributes.access.values : [];
  const managers = item.Attributes.managers ? item.Attributes.managers.values : [];
  item = {
    access: Array.from(access, (x) => x.substring(5)),
    managers: Array.from(managers, (x) => x.substring(5)),
  };
  item.uid = uid;
  item.lid = lid;
  return item;
}

async function updateManagers(uid, lid, managersList, viewerUID) {
  const managersSet = Array.from(managersList, (x) => "USER#" + x);
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "attribute_exists(SK) AND PK = :vu",
    UpdateExpression: "SET #m = :m DELETE #a :m",
    ExpressionAttributeNames: {
      "#a": "access",
      "#m": "managers",
    },
    ExpressionAttributeValues: {
      ":vu": "USER#" + viewerUID,
      ":m": client.createSet(managersSet),
    },
    ReturnValues: "ALL_NEW",
  };
  var item = await client.update(opts).promise();
  const access = item.Attributes.access ? item.Attributes.access.values : [];
  const managers = item.Attributes.managers ? item.Attributes.managers.values : [];
  item = {
    access: Array.from(access, (x) => x.substring(5)),
    managers: Array.from(managers, (x) => x.substring(5)),
  };
  item.uid = uid;
  item.lid = lid;
  return item;
}

async function deleteList(uid, lid, viewerUID) {
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "LIST#" + lid,
    },
    ConditionExpression: "PK = :vu",
    ExpressionAttributeValues: { ":vu": "USER#" + viewerUID },
  };
  return await client.delete(opts).promise();
}

module.exports = {
  createList,
  validateList,
  updateListWithPermission,
  updateAccessWithPermission,
  updateManagers,
  rewriteList,
  deleteList,
  getPermitedList,
  makeListPublic,
};
