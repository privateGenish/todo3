const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const cred = require("../../config/aws-credentials");
const client = new DocumentClient(cred);
const table = process.env.TABLE;

/**
 * getUser
 * @param {string} uid
 * @returns {object}
 */
async function getUser(uid) {
  if (typeof uid !== "string") {
    /// this error should rarely if ever be thrown as express is parsing json values to string
    throw TypeError("uid is not a string");
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

/**
 * getUSerPublicData
 * @param {string} uid
 * @returns {object}
 */
async function getUserPublicData(uid) {
  if (typeof uid !== "string") throw TypeError("uid is not a string");
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

//TODO: unit test the code
async function register(uid, name, email) {
  if (typeof uid !== "string") throw TypeError("uid is not a string");
  if (typeof name !== "string") throw TypeError("name is not a string");
  if (typeof email !== "string") throw TypeError("email is not a string");
  const result = await client
    .put({
      TableName: table,
      Item: {
        PK: "USER#" + uid,
        name: name,
        email: email,
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
  const response = await client
    .delete({ TableName: table, Key: { PK: "USER#" + uid }, ConditionExpression: "attribute_exists(PK)" })
    .promise()
    .catch((e) => {
      if (e.message == "The conditional request failed") throw APIError.itemNotFound({ uid: uid });
    });
  return response;
}

async function updateUser(uid){
  
}

module.exports = { getUserPublicData, getUser, register, deleteUser, updateUser
 };
