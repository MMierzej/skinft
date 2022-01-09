const fs = require('fs');
const ejs = require('ejs');
const http = require('http');
const multer = require('multer');
const express = require('express');

const app = express();
let upload = multer();


app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('./src/static'));


let db = [];
let image = fs.readFileSync('./images/test/2137.png', 'base64');

for (let i = 1; i <= 30; i++) {
    db.push({
        id: i,
        name: 'skin' + i,
        img: 'data:image/png;base64,' + image,
        priceUsd: 2,
        description: 'Iprem Losum'
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


http.createServer(app).listen(3000, () => {
    console.log('Server is running on port 3000...');
});