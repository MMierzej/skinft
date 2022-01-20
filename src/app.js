'use strict';

require('ejs');
const fs = require('fs');
const http = require('http');
const multer = require('multer');
const express = require('express');
require('express/lib/request');
const bodyParser = require('body-parser');
const sessions = require('express-session');
const cookieParser = require("cookie-parser");

require('./db/mongoose');
const Skin = require('./db/models/skin');

const app = express();
const upload = multer();

app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessions({
    secret: "sekretnyKlucz2137222137", // to trzeba ukrywac
    saveUninitialized:true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 10 }, // 10 dni
    resave: false 
}));
app.use(cookieParser());

const urlencodedParser = bodyParser.urlencoded({ extended: false }); // necessary?


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

let sessionUser = {};  // sejse beda zapamietana w bazie danych chyba
let sessionTime = {};

app.post('/login', urlencodedParser, auth, (req, res) => {
    if(req.logged) {
        res.render('index'); // + jakis komunikat ze jestesmy zalogowani
    }

    let validUsername = 'adrian';
    let validPassword = 'taxi';    

    let username = req.body.username;
    let password = req.body.password;

    console.log(req.session);
    // tutaj jakis request do bazy z walidacja

    if(username === validUsername && password === validPassword) {  // tymczasowo
        
        let session=req.session;
        session.userid = username;
        console.log(req.session)
        res.redirect('/');
    }
    else {
        let message = {text: 'zly login lub haslo'};
        res.render('login', {message});
    }  
});

app.get('/register', auth, (req, res) => {
    if (req.logged) {
        res.render('index'); // + jakis komunikat ze jestesmy zalogowani
    }
    res.render('register');
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

    // console.log(req.body);
    // TODO: validation [and checking if the skin already exists in the db]
    const newSkin = new Skin({
        name: req.body.name,
        thumbnail: fs.readFileSync('./images/test/2137.png', 'base64'), // base64 generated from the uploaded file
        description: req.body.description,
        priceUsd: req.body.price,
        status: req.body.status == 'on'
    });

    // the skin itself should be added to a separate folder
    // skin's file name should be the unique id of the object in the db

    await newSkin.save();
    res.redirect('/');
});

app.post('/register', upload.single(), auth, (req, res) => {
    if (req.logged) {
        res.render('index'); // + jakis komunikat ze jestesmy zalogowani
    }

    // proces tworzenia konta, sprawdzamy czy email lub username nie sa zajete
    // jesli nie => dodajemy konto do bazy, pamietamy o szyfrowaniu hasla
    
    res.render('login') // z komunikatem: konto zostalo utworzone
});

app.delete('/logout', auth, (req, res) => {
    if(req.logged) {
        req.session.destroy();
        // usuwamy sesje z bazy danych
    }
    res.render('index');
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
    console.log('Server is running on port 3000.');
});