// lambda/presignedUrl/presignedUrl.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: event.queryStringParameters.filename,
        Expires: 60, // Expiry time in seconds
        ACL: 'private' // Access control
    };

    try {
        const url = await s3.getSignedUrlPromise('putObject', params);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: url
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: 'Failed to create a presigned URL'
        };
    }
};
