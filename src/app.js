const fs = require('fs');
const ejs = require('ejs');
const http = require('http');
const multer = require('multer');
const express = require('express');
const req = require('express/lib/request');
const sessions = require('express-session');
const cookieParser = require("cookie-parser");

const app = express();
let upload = multer();


app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));

app.use(sessions({
    secret: "sekretnyKlucz2137222137", // to trzeba ukrywac
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 10 }, // 10 dni
    resave: false
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

let db = [];
let image = fs.readFileSync('./images/test/2137.png', 'base64');
// image = '';

for (let i = 1; i <= 30; i++) {
    db.push({
        id: i,
        name: 'skin' + i,
        img: 'data:image/png;base64,' + image,
        betterImg: 'data:image/png;base64,' + image, // tymczasowo
        priceUsd: 2,
        description: 'Flying fish few by the space station. She was the type of girl that always burnt sugar to show she cared. The hawk didnt understand why the ground squirrels didnt want to be his friend.',
        state: 'available'
    })
}


app.get('/', auth, upload.single(), (req, res) => {
    if(req.session.userid) {
        res.render('index', {user : req.session.userid});
    }
    else {
        res.render('index');
    }
});

app.post('/items', upload.single(), (req, res) => {
    let o = db.slice(0, 9);
    res.json(o);
})

app.get('/item/:id', (req, res) => {
    let item = db[req.params.id]; // <-- Tutaj ladne zapytanie do bazy danych
    res.render('item', {item});
})

app.get('/login', auth, (req, res) => {
    if(req.session.userid) {
        res.redirect('/'); // + jakis komunikat ze jestesmy zalogowani
    }
    else {
        res.render('login');
    }
});

// sejse beda zapamietana w bazie danych przy pomocy connect-mongo 

app.post('/login', auth, (req, res) => {
    if(req.session.userid) {
        res.redirect('/'); // + jakis komunikat ze jestesmy zalogowani
    }

    let validUsername = 'adrian';
    let validPassword = 'taxi';    

    let username = req.body.username;
    let password = req.body.password;

    // console.log(req.session);
    // tutaj jakis request do bazy z walidacja

    if(username === validUsername && password === validPassword) {  // tymczasowo
        
        let session=req.session;
        session.userid = username;
        //console.log(req.session)
        res.redirect('/');
    }
    else {
        let message = {text: 'zly login lub haslo'};
        res.render('login', {message});
    }  
});

app.get('/register', auth, (req, res) => {
    if(req.session.userid) {
        res.redirect('/'); // + jakis komunikat ze jestesmy zalogowani
    }
    else {
        res.render('register');
    }
});

app.post('/register', upload.single(), auth, (req, res) => {
    if (req.session.userid) {
        res.redirect('/'); // + jakis komunikat ze jestesmy zalogowani
    }
    else {
        // proces tworzenia konta, sprawdzamy czy email lub username nie sa zajete
        // jesli nie => dodajemy konto do bazy, pamietamy o szyfrowaniu hasla
        res.redirect('/'); // z komunikatem: konto zostalo utworzone
    }
    
});

app.get('/logout', auth, (req, res) => {  // chyba tymczasowo get 
    if(req.session.userid) {
        req.session.destroy();
    }
    res.redirect('/');
});


function auth(req, res, next) { // tu bedziemy sprawdzac middlewareowo czy ktos jest zalogowany i czy jest adminem

    if(req.session.userid) {
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