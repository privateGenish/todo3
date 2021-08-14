const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const cred = require("../../config/aws-credentials");
const client = new DocumentClient(cred);
const table = process.env.TABLE;

async function getUser(uid) {
  if (typeof uid !== "string") {
    throw Error("uid not provided");
  }
  var opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
    },
  };
  var item = await client.get(opts).promise();
  item = JSON.parse(JSON.stringify(item, null, 2));
  return item;
}
async function getUserPublicData(uid) {
  if (typeof uid !== "string") {
    throw Error("uid not provided");
  }
  var opts = {
    TableName: table,
    Key: {
      PK: "USER#" + uid,
    },
    ExpressionAttributeNames: { "#n": "Name", "#p": "public" },
    ProjectionExpression: "About, Lists.#p, #n",
  };
  var item = await client.get(opts).promise();
  item = JSON.parse(JSON.stringify(item, null, 2));
  return item;
}
async function register(uid, name, email) {
  if (typeof uid !== "string" || typeof name !== "string" || typeof email !== "string") {
    throw Error("input error");
  }
  const result = await client
    .put({
      TableName: table,
      Item: {
        PK: "UID#" + uid,
        name: name,
        email: email,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    })
    .promise();
  return result;
}
async function deleteUser(uid) {
  if (typeof uid !== "string") throw Error("AssertionError");
  const response = await client.delete({ TableName: table, Key: { PK: "UID#" + uid } }).promise();
  return response;
}

module.exports = { getUserPublicData, getUser, register, deleteUser };