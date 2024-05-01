const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { inputText, filePath } = JSON.parse(event.body);
  const id = require('crypto').randomBytes(16).toString('hex');

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id: id,
      inputText: inputText,
      filePath: filePath,
      processedTime: new Date().toISOString()
    }
  };

  try {
    await dynamoDB.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully', id: id }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error saving data" })
    };
  }
};
