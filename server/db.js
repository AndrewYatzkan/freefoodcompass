require('dotenv').config();

const mongoose = require('mongoose');

let CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
if (!CONNECTION_STRING) {
    console.log('No DB_CONNECTION_STRING environment variable');
    process.exit(0);
}

mongoose.set('strictQuery', true); // suppresses warning

function connect() {
    return mongoose.connect(CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}

// attempt to fix serverless functions crashing
connect().catch(e => {
    console.log('Caught mongoose connection error\n', e);
    connect();
});

const connection = mongoose.connection;
connection.once('open', () => console.log('MongoDB database connection established successfully'));

module.exports = { mongoose };
