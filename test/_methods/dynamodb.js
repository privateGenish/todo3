const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const cred = require("../../config/aws-credentials");
const client = new DocumentClient(cred);
const table = process.env.TABLE;

async function deleteTestItem(pk, sk) {
  const opts = {
    TableName: table,
    Key: {
      PK: pk,
      SK: sk,
    },
  };
  return await client.delete(opts, () => {}).promise();
}

async function createTestItem(pk, sk) {
  return await client
    .put({
      TableName: table,
      Item: {
        PK: pk,
        SK: sk,
      },
    })
    .promise();
}

async function getSingleItem(pk, sk) {
  return await client
    .get({
      TableName: table,
      Key: {
        PK: pk,
        SK: sk,
      },
    })
    .promise();
}

module.exports = { deleteTestItem, createTestItem, getSingleItem };
