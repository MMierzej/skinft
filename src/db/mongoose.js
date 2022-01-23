const fs = require('fs');
const mongoose = require('mongoose');
// const dbUrl = 'mongodb://127.0.0.1:27017/test';  // db from the local server
const password = fs.readFileSync('./src/db/mongodb-password', 'utf-8');
const dbUrl = `mongodb+srv://dbman:${password}@weppo-project.yolqd.mongodb.net/SKINFT?retryWrites=true&w=majority`;

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Database connection established.'))
    .catch((err) => console.log(err));

module.exports.dbConn = mongoose.connection;