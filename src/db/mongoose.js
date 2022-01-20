const fs = require('fs');
const mongoose = require('mongoose');
// const dbUrl = 'mongodb://127.0.0.1:27017/test';
const password = fs.readFileSync('./src/db/mongodb-password', 'utf-8');
const dbUrl = `mongodb+srv://dbman:${password}@weppo-project.yolqd.mongodb.net/SKINFT?retryWrites=true&w=majority`

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to the DB.'))
    .catch((err) => console.log(err));