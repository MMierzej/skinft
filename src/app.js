'use strict';

require('ejs');
const fs = require('fs');
const http = require('http');
const multer = require('multer');
const express = require('express');
require('express/lib/request');

require('./db/mongoose');
const Skin = require('./db/models/skin')

const app = express();
const upload = multer();

app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));

app.get('/', upload.single(), (req, res) => {
    res.render('index');
});

app.post('/items', upload.single(), async (req, res) => {
    // req.body -- filters
    let pageNo = req.body.pageNo || 0;
    let skinsOnPage = req.body.skinsOnPage || 9;

    const result = await Skin.find({}).lean().skip(pageNo * skinsOnPage).limit(skinsOnPage);
    res.json(result);
});

app.get('/item/:name', async (req, res) => {
    const item = await Skin.findOne({ name: req.params.name });
    // console.log(item);
    res.render('item', { item });
});

app.get('/login', auth, (req, res) => {
    if (req.logged) {
        res.render('index'); // + jakis komunikat ze jestesmy zalogowani
    }
    res.render('login');
});

app.get('/register', auth, (req, res) => {
    if (req.logged) {
        res.render('index'); // + jakis komunikat ze jestesmy zalogowani
    }
    res.render('register');
});

app.delete('/logout', auth, (req, res) => {
    if (req.logged) {
        // usuwamy sesje
    }
    res.render('index');
});

app.get('/new-item', upload.single(), (req, res) => {
    res.render('new-item');
});

/* TODO */
app.post('/new-item', upload.single(), async (req, res) => {
    // FOR TESTING PURPOSES ONLY!
    // const result = await new Skin({
    //     name: 'test07',
    //     thumbnail: fs.readFileSync('./images/test/2137.png', 'base64'),
    //     description: 'test',
    //     priceUsd: 999999999,
    //     status: true
    // }).save();
    // console.log(result);

    // TODO: validation [and checking if the skin already exists in the db]
    const newSkin = new Skin({
        name: req.body.name,
        thumbnail: fs.readFileSync('./images/test/2137.png', 'base64'), // base64 generated from the uploaded file
        description: req.body.description,
        priceUsd: req.body.price,
        status: req.body.status
    });

    // the skin itself should be added to a separate folder
    // skin's file name should be the unique id of the object in the db

    await newSkin.save();
    res.redirect('/');
});


function auth(req, res, next) { // tu bedziemy sprawdzac middlewareowo czy ktos jest zalogowany i czy jest adminem
    if (req.query.session === 'x') {
        req.logged = true;
    }
    else {
        req.logged = false;
    }
    next();
}

http.createServer(app).listen(3000, () => {
    console.log('Server is running on port 3000...');
});