const fs = require('fs');
const ejs = require('ejs');
const http = require('http');
const multer = require('multer');
const express = require('express');
const req = require('express/lib/request');

const app = express();
let upload = multer();


app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));


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


app.get('/', upload.single(), (req, res) => {
    //req.body.
    res.render('index');
});

app.post('/items', upload.single(), (req, res) => {
    let o = db.slice(0, 9);
    res.json(o);
})

app.get('/item/:id', (req, res) => {
    let item = db[req.params.id]; // <-- Tutaj ladne zapytanie do bazy danych
    res.render('item', {item});
})

http.createServer(app).listen(3000, () => {
    console.log('Server is running on port 3000...');
});