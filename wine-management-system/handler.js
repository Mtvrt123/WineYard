"use strict";

const AWS = require("aws-sdk");
const uuid = require("uuid");

const docClient = new AWS.DynamoDB.DocumentClient({
    endpoint: "http://localhost:4566", // Localstack DynamoDB endpoint
    region: "us-east-1",
});

const TABLE_NAME = process.env.BOTTLE_TABLE;
// cd wine-management-system
//aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name wine-management-system-bottle --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region us-east-1
//aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket wine-management-system-uploads --region us-east-1
//serverless offline --stage local

module.exports.createBottle = async (event) => {
    const body = JSON.parse(event.body);
    const { name, year, price } = body;

    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: uuid.v4(),
            name,
            year,
            price,
        },
    };

    try {
        await docClient.put(params).promise();
        return {
            statusCode: 201,
            body: JSON.stringify(params.Item),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

module.exports.getBottle = async (event) => {
    const { id } = event.pathParameters;

    const params = {
        TableName: TABLE_NAME,
        Key: {
            id,
        },
    };

    try {
        const data = await docClient.get(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(data.Item),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

module.exports.getBottles = async () => {
    const params = {
        TableName: TABLE_NAME,
    };

    try {
        const data = await docClient.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(data.Items),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

module.exports.updateBottle = async (event) => {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { name, year, price } = body;

    const params = {
        TableName: TABLE_NAME,
        Key: {
            id,
        },
        UpdateExpression: "set #name = :n, #year = :y, #price = :p",
        ExpressionAttributeNames: {
            "#name": "name",
            "#year": "year",
            "#price": "price",
        },
        ExpressionAttributeValues: {
            ":n": name,
            ":y": year,
            ":p": price,
        },
        ReturnValues: "ALL_NEW",
    };

    try {
        const data = await docClient.update(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(data.Attributes),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

module.exports.deleteBottle = async (event) => {
    const { id } = event.pathParameters;

    const params = {
        TableName: TABLE_NAME,
        Key: {
            id,
        },
    };

    try {
        await docClient.delete(params).promise();
        return {
            statusCode: 204,
            body: JSON.stringify({}),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}
