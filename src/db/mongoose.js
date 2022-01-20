const mongoose = require('mongoose');
const dbUrl = 'mongodb://127.0.0.1:27017/test';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to the DB.'))
    .catch((err) => console.log(err));