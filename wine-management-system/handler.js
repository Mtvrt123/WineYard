"use strict";

const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");

AWS.config.update({ region: "us-east-1", endpoint: "http://localhost:4566" });

const TABLE_NAME = process.env.BOTTLE_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;
const USERS_TABLE = process.env.USERS_TABLE;
const EVENTS_TABLE = process.env.EVENTS_TABLE;
// cd wine-management-system
//localstack start
//aws configure set aws_access_key_id test
//aws configure set aws_secret_access_key test
//aws configure set default.region us-east-1
//aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name wine-management-system-bottle --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region us-east-1
//aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name wine-management-system-users --attribute-definitions AttributeName=username,AttributeType=S --key-schema AttributeName=username,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region us-east-1
//aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name wine-management-system-events --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region us-east-1
//aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address wine-management-system@local.com --region us-east-1
//aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address testemail@mail.com --region us-east-1
//aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket wine-management-system-uploads --region us-east-1
//aws --endpoint-url=http://localhost:4566 sns create-topic --name wine-management-system-topic --region us-east-1
//serverless offline --stage local

//# Create the S3 bucket
//aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket wine-management-system-uploads --region us-east-1

//# Upload a file to the S3 bucket
//aws --endpoint-url=http://localhost:4566 s3 cp some-file.txt s3://wine-management-system-uploads/some-file.txt

//# Verify the file upload
//ws --endpoint-url=http://localhost:4566 s3 ls s3://wine-management-system-uploads


const docClient = new AWS.DynamoDB.DocumentClient({
    endpoint: "http://localhost:4566", // Localstack DynamoDB endpoint
    region: "us-east-1",
});

const ses = new AWS.SES({
    endpoint: "http://localhost:4566", // Localstack SES endpoint
    region: "us-east-1",
});

const sns = new AWS.SNS({
    endpoint: "http://localhost:4566", // Localstack SNS endpoint
    region: "us-east-1",
});

// Method to log events
module.exports.logEvent = async (eventType, eventData) => {
    console.log("Log Event: ", eventType, eventData);

    const params = {
        TableName: process.env.EVENTS_TABLE,
        Item: {
            id: uuid.v4(),
            type: eventType,
            data: eventData,
        },
    };

    await docClient.put(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Event logged successfully" }),
    };
};

// Method to get all logged events
module.exports.getAllEvents = async (event) => {
    const params = {
        TableName: process.env.EVENTS_TABLE,
    };

    try {
        const data = await docClient.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(data.Items),
        };
    } catch (error) {
        console.error("Error getting events: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

// Method to send an email using SES
module.exports.sendEmail = async (subject, text) => {
    const params = {
        Source: process.env.SOURCE_EMAIL,
        Destination: {
            ToAddresses: [process.env.ADMIN_EMAIL],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Text: {
                    Data: text,
                },
            },
        },
    };

    try {
        await ses.sendEmail(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email sent successfully" }),
        };
    } catch (error) {
        console.error("Error sending email: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

// Middleware to validate JWT
const authenticateJWT = (event) => {
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
        throw new Error('No token provided');
    }
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Unauthorized');
    }
};


// Add user to the database
module.exports.createUser = async (event) => {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    const params = {
        TableName: USERS_TABLE,
        Item: {
            username,
            password,
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
};


// Method to get a JWT token
module.exports.getToken = async (event) => {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    const params = {
        TableName: USERS_TABLE,
        Key: {
            username,
        },
    };

    try {
        const data = await docClient.get(params).promise();

        if (data.Item && data.Item.password === password) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
            return {
                statusCode: 200,
                body: JSON.stringify({ token }),
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' }),
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

// Data Changes: DynamoDB CRUD operations with JWT authentication, logging, and email notifications
module.exports.createBottle = async (event) => {
    authenticateJWT(event);
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
};

module.exports.getBottle = async (event) => {
    authenticateJWT(event);
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
};

module.exports.getBottles = async (event) => {
    authenticateJWT(event);
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
};

module.exports.updateBottle = async (event) => {
    authenticateJWT(event);
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
};

module.exports.deleteBottle = async (event) => {
    authenticateJWT(event);
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
};

// Scheduled Task: CloudWatch scheduled event to send email summary
module.exports.scheduledEvent = async (event) => {
    try {
        const params = {
            TableName: TABLE_NAME,
        };

        const data = await docClient.scan(params).promise();

        const emailParams = {
            Source: process.env.SOURCE_EMAIL,
            Destination: {
                ToAddresses: [process.env.ADMIN_EMAIL],
            },
            Message: {
                Subject: {
                    Data: "Daily Bottles Summary",
                },
                Body: {
                    Text: {
                        Data: JSON.stringify(data.Items),
                    },
                },
            },
        };

        //await module.exports.sendEmail("Daily Bottles Summary", JSON.stringify(data.Items));
        await module.exports.sendSnsNotification("Daily Bottles Summary", "Bottles summary sent via email.");
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Scheduled task executed and email sent successfully",
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

module.exports.SnsLogMessage = async (event) => {
    console.log("Received SNS event:", JSON.stringify(event, null, 2));

    await module.exports.logEvent("SNS", event);

    event.Records.forEach((record) => {
        const snsMessage = record.Sns;
        console.log("SNS Message:", snsMessage);
    });

    return {
        statusCode: 200,
        body: JSON.stringify("Message logged successfully!"),
    };
};

module.exports.sendSnsNotification = async (subject, message) => {
    const params = {
        Message: message,
        Subject: subject,
        TopicArn: process.env.SNS_TOPIC_ARN,
    };

    await sns.publish(params).promise();

    console.log("SNS notification sent:", JSON.stringify(params));
};

module.exports.logTableChanges = async (event) => {
    console.log("Received DynamoDB event:", JSON.stringify(event, null, 2));

    event.Records.forEach((record) => {
        if (record.eventName === "INSERT") {
            const newItem = record.dynamodb.NewImage;
            console.log(
                "New item inserted:",
                AWS.DynamoDB.Converter.unmarshall(newItem)
            );
        }
    });

    return {
        statusCode: 200,
        body: JSON.stringify("DynamoDB change logged successfully!"),
    };
};

module.exports.logS3Event = async (event) => {
    console.log("Received S3 event:", JSON.stringify(event, null, 2));

    event.Records.forEach((record) => {
        const s3 = record.s3;
        console.log("S3 Event:", s3);
    });

    return {
        statusCode: 200,
        body: JSON.stringify("S3 event logged successfully!"),
    };
};