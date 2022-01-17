const fs = require('fs');
const ejs = require('ejs');
const http = require('http');
const multer = require('multer');
const express = require('express');
const req = require('express/lib/request');
const mongoClient = require('mongodb').MongoClient;
// operacje bazodanowe będą umieszczone w obiekcie
// odpowiadającym za interakcje z bazą danych

const dbUrl = 'mongodb://localhost:27017/test';  // defaultowa testowa baza danych
const app = express();
let upload = multer();

app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));


let fakeDb = [];
let image = fs.readFileSync('./images/test/2137.png', 'base64');

for (let i = 1; i <= 30; i++) {
    fakeDb.push({
        id: i,
        name: 'skin' + i,
        img: 'data:image/png;base64,' + image,
        betterImg: 'data:image/png;base64,' + image, // tymczasowo
        priceUsd: 2,
        description: 'Flying fish few by the space station. She was the type of girl that always burnt sugar to show she cared. The hawk didnt understand why the ground squirrels didnt want to be his friend.',
        state: 'available'
    })
}


app.get('/', upload.single(), (req, res) => {
    //req.body.
    res.render('index');
});

app.post('/items', upload.single(), (req, res) => {
    // w req.body można później przekazywać filtry zapytania

    let pageNo = 0;  // numer strony wyświetlanych skinów
    let skinsOnPage = 9;
    let resultArr;

    mongoClient.connect(dbUrl, (err, db) => {
        if (err) throw err;
        resultArr = db.collection('skins')
            .find().skip(pageNo * skinsOnPage)
            .limit(skinsOnPage).toArray();
    });

    res.json(resultArr);
});

app.get('/item/:id', (req, res) => {
    let item;

    mongoClient.connect(dbUrl, (err, db) => {
        if (err) throw err;
        item = db.collection('skins').findOne({ id: req.params.id });
    });

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

app.post('/new-item', upload.single(), auth, (req, res) => {
    // szkic procedury
    // przeczytanie body i umieszczenie w bazie danych nowego skina
    let newSkin = {
        name: 'skinFromDb'
    }

    mongoClient.connect(dbUrl, (err, db) => {
        if (err) throw err;
        db.collection('skins').insertOne(newSkin, (err, res) => {
            if (err) throw err;
            console.log('inserted a new skin');
            db.close();
        });
    });
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