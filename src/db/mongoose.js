const fs = require('fs');
const mongoose = require('mongoose');
const password = JSON.parse(fs.readFileSync('./src/secret-data.json', 'utf-8')).dbPassword;

const dbUrl = 'mongodb://127.0.0.1:27017/test';  // db from the local server
// const dbUrl = `mongodb+srv://dbman:${password}@weppo-project.yolqd.mongodb.net/SKINFT?retryWrites=true&w=majority`;

module.exports = async function () {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Database connection established.');
    return mongoose.connection;
}