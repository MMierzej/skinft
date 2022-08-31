const fs = require('fs');
const mongoose = require('mongoose');

// let credentials, root, password;
// try {
//     credentials = JSON.parse(fs.readFileSync('./src/secret-data.json', 'utf-8')).dbPassword;
//     [root, password] = [credentials.dbRootName, credentials.dbRootPassword];
// } catch (error) {
//     console.log(error)
// }

[root, password] = ['root', 'toor'];
const dbUrl = `mongodb://${root}:${password}@mongo:27017/local?authSource=admin`;
// const dbUrl = `mongodb+srv://${root}:${password}@weppo-project.yolqd.mongodb.net/SKINFT?retryWrites=true&w=majority`;

module.exports = async function () {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Database connection established.');
    return mongoose.connection;
}