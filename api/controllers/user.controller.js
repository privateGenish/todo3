const { Chime, Outposts } = require("aws-sdk");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const { AssertionError } = require("chai");
const { O_EXCL } = require("constants");
const { response } = require("express");
const { request } = require("https");
const cred = require("../../config/aws-credentials");
const client = new DocumentClient(cred);
const table = process.env.TABLE;

async function getUser(uid) {
  if (typeof uid !== "string") {
    /// this error should rarely if ever be thrown as express is parsing json values to string
    throw TypeError("uid is not a string");
  }
  var opts = {
    TableName: table,
    KeyConditionExpression: "PK = :uid",
    ExpressionAttributeValues: {
      ":uid": "USER#" + uid,
    },
  };
  var items = await client.query(opts).promise();
  items = items.Items;
  items.forEach((element) => {
    if (element.PK == element.SK) {
      element.uid = element.PK.substring(5);
    } else {
      element.listId = element.SK.substring(5);
    }
    delete element.PK;
    delete element.SK;
  });
  return items;
}

async function getUserAvailableScope(uid, viewerUID) {
  if (typeof uid !== "string") {
    /// this error should rarely if ever be thrown as express is parsing json values to string
    throw TypeError("uid is not a string");
  }
  var opts = {
    TableName: table,
    KeyConditionExpression: "PK = :uid",
    ExpressionAttributeValues: {
      ":uid": "USER#" + uid,
      ":vu": "USER#" + viewerUID,
    },
    FilterExpression:
      "contains(#a, :vu) OR contains(#m, :vu) OR (attribute_not_exists(managers) AND attribute_not_exists(access))",
    ExpressionAttributeNames: {
      "#m": "managers",
      "#a": "access",
    },
  };
  var items = await client.query(opts).promise();
  items = items.Items;
  items.forEach((element) => {
    if (element.PK == element.SK) {
      element.uid = element.PK.substring(5);
    } else {
      element.listId = element.SK.substring(5);
    }
    delete element.PK;
    delete element.SK;
  });
  return items;
}

async function getUserPublicData(uid) {
  if (typeof uid !== "string") {
    /// this error should rarely if ever be thrown as express is parsing json values to string
    throw TypeError("uid is not a string");
  }
  var opts = {
    TableName: table,
    KeyConditionExpression: "PK = :uid",
    FilterExpression: "attribute_not_exists(access)",
    ExpressionAttributeValues: {
      ":uid": "USER#" + uid,
    },
  };
  var items = await client.query(opts).promise();
  items = items.Items;
  items.forEach((element) => {
    if (element.PK == element.SK) {
      element.uid = element.PK.substring(5);
    } else {
      element.listId = element.SK.substring(5);
    }
    delete element.PK;
    delete element.SK;
  });
  return items;
}

//TODO: unit test the code
async function register(uid, name) {
  if (typeof uid !== "string") throw TypeError("uid is not a string");
  if (typeof name !== "string") throw TypeError("name is not a string");
  const result = await client
    .put({
      TableName: table,
      Item: {
        PK: "USER#" + uid,
        SK: "USER#" + uid,
        name: name,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    })
    .promise()
    .catch((err) => {
      if (err.code == "ConditionalCheckFailedException") throw APIError.alreadyExists({ uid: uid });
    });
  return result;
}

async function deleteUser(uid) {
  if (typeof uid !== "string") throw TypeError("uid is not a string");
  const query = await client
    .query({
      TableName: table,
      KeyConditionExpression: "PK = :uid",
      ExpressionAttributeValues: {
        ":uid": "USER#" + uid,
      },
      ProjectionExpression: "PK, SK",
    })
    .promise();
  const items = query.Items;
  if (items.length === 0) throw APIError.itemNotFound({ uid: uid });
  for (let i = 0; i < items.length; i += 25) {
    let deleteRequests = Array.from(items.slice(i, i + 25), (element) => {
      let deleteRequest = {
        DeleteRequest: {
          Key: {
            PK: element.PK,
            SK: element.SK,
          },
        },
      };
      return deleteRequest;
    });
    let requestItems = {};
    requestItems[table] = deleteRequests;
    await client
      .batchWrite({
        RequestItems: requestItems,
      })
      .promise();
  }
  return;
}

async function updateUser({ uid, about, name }) {
  if (typeof uid !== "string") throw TypeError("uid is not a string");
  if (typeof about !== "string" && typeof name !== "string")
    throw TypeError("must provide at least one, about or name. both must be in a string form.");
  let updateExpression = "set ";
  let opts = {
    TableName: table,
    UpdateExpression: updateExpression,
    Key: {
      PK: "USER#" + uid,
      SK: "USER#" + uid,
    },
    ExpressionAttributeValues: {},
  };
  if (about) {
    opts.UpdateExpression += "about = :val1";
    opts.ExpressionAttributeValues[":val1"] = about;
  }
  if (name && about) opts.UpdateExpression += ", ";
  if (name) {
    opts.UpdateExpression += "#n = :val2";
    opts.ExpressionAttributeValues[":val2"] = name;
    opts.ExpressionAttributeNames = { "#n": "name" };
  }
  await client.update(opts).promise();
}

async function batchGetUsersInfo(uids) {
  if (!Array.isArray(uids)) {
    /// this error should rarely if ever be thrown as express is parsing json values to string
    throw TypeError("uids are not an Array");
  }
  var opts = {
    RequestItems: {},
  };
  opts.RequestItems[table] = {
    ProjectionExpression: "#n, PK",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    Keys: Array.from(uids, (e) => {
      return { PK: "USER#" + e, SK: "USER#" + e };
    }),
  };
  const response = await client.batchGet(opts).promise();
  let items = [];
  Array.from(response.Responses[table], (e) => {
    items.push({ uid: e.PK.substring(5), name: e.name });
  });
  return items;
}

async function batchWriteLikedList(uid, likedList) {
  if (typeof uid !== "string" || typeof likedList !== "object") {
    throw TypeError("uid is not a string or likedList in not an object");
  }
  var item = {};
  /// this error should rarely if ever be thrown as express is parsing json values to string
  const opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
      SK: "USER#" + uid,
    },
    ReturnValues: "ALL_NEW",
    // ProjectionExpression: "#n, PK, likedLists",
    // ExpressionAttributeNames: { "#n": "name" },
    // ConditionExpression: "attribute_exists(likedLists)",
  };
  if (likedList.add) {
    const add = likedList.add;
    var optsSET = opts;
    optsSET.UpdateExpression = " ADD likedLists :a";
    optsSET.ExpressionAttributeValues = {
      ":a": client.createSet(add),
    };
    const response = await client.update(optsSET).promise();
    item = response;
  }
  if (likedList.remove) {
    const remove = likedList.remove;
    var optsDELETE = opts;
    optsDELETE.UpdateExpression = "DELETE likedLists :re";
    optsDELETE.ExpressionAttributeValues = {
      ":re": client.createSet(remove),
    };
    const response = await client.update(optsDELETE).promise();
    item = response;
  }
  item.uid = item.Attributes.PK.substring(5);
  delete item.Attributes.PK;
  delete item.Attributes.SK;
  item.likedLists = item.Attributes.likedLists.values;
  delete item.Attributes.likedLists;
  Object.keys(item.Attributes).forEach((e) => {
    item[e] = item.Attributes[e];
  });
  delete item.Attributes;
  return item;
}
module.exports = {
  getUserPublicData,
  getUser,
  register,
  deleteUser,
  updateUser,
  getUserAvailableScope,
  batchGetUsersInfo,
  batchWriteLikedList,
};
