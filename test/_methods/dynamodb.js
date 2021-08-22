const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const cred = require("../../config/aws-credentials");
const client = new DocumentClient(cred);
const table = process.env.TABLE;

async function deleteTestItem(id) {
  return await client
    .delete(
      {
        TableName: table,
        Key: {
          PK: id,
        },
      },
      () => {}
    )
    .promise();
}

async function createTestItem(id, args) {
  if (args)
    return await client
      .put({
        TableName: table,
        Item: {
          PK: id,
          args,
        },
      })
      .promise();

  return await client
    .put({
      TableName: table,
      Item: {
        PK: id,
      },
    })
    .promise();
}


module.exports = { deleteTestItem, createTestItem };
