'use strict';

require('ejs');
const fs = require('fs');
const http = require('http');
const multer = require('multer');
const express = require('express');
const sessions = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { createHash } = require('crypto');


(async () => {
    const dbConn = await require('./db/mongoose')();  // function call!
    const { Skin } = require('./db/models/skin');
    const { User } = require('./db/models/user');
    const { Order } = require('./db/models/order');

    const app = express();
    const fileStorageEngine = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "./images");
        },
        filename: (() => {
            let cnt = 0;
            return (req, file, cb) => {
                cb(null, Date.now() + "--" + file.originalname + cnt++);
                cnt %= 64;
            }
        })(),
    });
    const upload = multer({ storage: fileStorageEngine });

    app.set('views', './src/views');
    app.set('view engine', 'ejs');
    app.use(express.static('./src/static'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(sessions({
        secret: ((sessionSecret) => {
            try {
                sessionSecret = JSON.parse(fs.readFileSync('./src/secret-data.json', 'utf-8')).sessionSecret;
            } catch (error) {
                console.error(error);
            }
            return sessionSecret;
        })('defaultSecret'),
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 1 }, // a day
        resave: false,
        store: MongoStore.create({ client: dbConn.getClient() })
    }));


    // routing

    app.get('/', upload.single(), (req, res) => {
        if (req.session.userid) {
            res.render('index', { user: req.session.userid, admin: req.session.admin });
        } else {
            res.render('index', { message: req.query.message });
        }
    });

    app.post('/items', upload.single(), async (req, res) => {
        // req.body -- filters
        const result = await Skin.find({
            name: { $regex: `${req.body.name}`, $options: "i" },
            status: ('true' == req.body.available) || { $exists: true }
        })
            .lean()
            .skip(req.body.page * req.body.itemsOnPage)
            .limit(req.body.itemsOnPage);
        res.json(result);
    });

    app.get('/item/:name', async (req, res) => {
        const item = await Skin.findOne({ name: req.params.name }).lean().exec();
        if (item === null) {
            res.redirect('/');
        } else if (req.session.admin) {
            res.render('item-edit', { item, user: req.session.userid, admin: req.session.admin });
        } else {
            res.render('item', { item, user: req.session.userid, admin: req.session.admin });
        }
    });

    app.get('/new-item', upload.single(), (req, res) => {
        if (req.session.admin) {
            res.render('new-item', { user: req.session.userid, admin: req.session.admin });
        } else {
            res.redirect('/');
        }
    });

    app.post('/new-item', upload.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'skin', maxCount: 1 }
    ]), async (req, res) => {
        if (!req.session.admin) {
            res.redirect('/');
            return;
        }

        const thumbnail = req.files.thumbnail[0];
        const skin = req.files.skin[0];

        const thumbnailB64 = fs.readFileSync(thumbnail.path, 'base64');
        const skinB64 = fs.readFileSync(skin.path, 'base64');
        // file deletion
        fs.unlinkSync(thumbnail.path);
        fs.unlinkSync(skin.path);

        if (null !== await Skin.findOne({ name: req.body.name }).exec()) {
            res.render('new-item', {
                message: 'Skin with such name already exists.',
                user: req.session.userid,
                admin: req.session.admin
            });
            return;
        }

        const newSkin = new Skin({
            name: req.body.name,
            thumbnail: thumbnailB64,
            skin: skinB64,
            description: req.body.description,
            priceUsd: req.body.price,
            status: req.body.status == 'on'
        });
        await newSkin.save();
        res.redirect('/');
    });

    app.post('/edit/:name', upload.fields([  // ideally PUT, however HTML forms don't support it
        { name: 'thumbnail', maxCount: 1 },
        { name: 'skin', maxCount: 1 }
    ]), async (req, res) => {
        if (!req.session.admin) {
            res.redirect('/');
            return;
        }

        let thumbnail;
        let skin;
        if (req.files.thumbnail) {
            thumbnail = fs.readFileSync(req.files.thumbnail[0].path, 'base64');
            fs.unlinkSync(req.files.thumbnail[0].path);
        }
        if (req.files.skin) {
            skin = fs.readFileSync(req.files.skin[0].path, 'base64');
            fs.unlinkSync(req.files.skin[0].path);
        }

        let item = await Skin.findOne({ name: req.params.name }).lean().exec();  // currently in the db
        if (item === null) {
            res.render('item-edit', { item, message: 'Error', user: req.session.userid, admin: req.session.admin });
            return;
        }

        const checkName = await Skin.findOne({ name: req.body.name }).lean().exec();
        if (req.body.name !== req.params.name && checkName !== null) {
            res.render('item-edit', { item, message: 'Name is occupied', user: req.session.userid, admin: req.session.admin });
            return;
        }

        thumbnail = thumbnail || item.thumbnail;
        skin = skin || item.skin;
        item = await Skin.findOneAndUpdate({ name: req.params.name }, {
            name: req.body.name,
            thumbnail,
            skin,
            description: req.body.description,
            priceUsd: req.body.price,
            status: req.body.status == 'on'
        }, { new: true }).lean().exec();

        res.render('item-edit', { item, message: 'Success', user: req.session.userid, admin: req.session.admin });
    });

    app.post('/delete/:name', async (req, res) => {
        if (!req.session.admin) {
            res.redirect('/');
        } else {
            const name = req.params.name;
            await Skin.findOneAndRemove({ name: name });
            res.redirect('/');
        }
    });

    app.get('/login', (req, res) => {
        if (req.session.userid) {
            res.redirect('/?message=' + 'Already logged in.');
        } else {
            res.render('login');
        }
    });

    app.post('/login', async (req, res) => {
        if (req.session.userid) {
            res.redirect('/?message=' + 'Already logged in.');
        }

        const username = req.body.username;
        const password = createHash('sha256').update(req.body.password).digest('hex');
        const account = await User.findOne({ username }).lean().exec();

        if (account !== null && account.password === password) {
            let session = req.session;
            session.userid = username;
            session.admin = account.admin;
            session.cart = [];
            res.redirect('/?message=' + 'Logged in successfully.');
        } else {
            res.render('login', { message: 'Invalid login or password.' });
        }
    });

    app.get('/register', (req, res) => {
        if (req.session.userid) {
            res.redirect('/?message=' + 'Already logged in.');
        } else {
            res.render('register');
        }
    });

    app.post('/register', upload.single(), async (req, res) => {
        if (req.session.userid) {
            res.redirect('/?message=' + 'Already logged in.');
        } else {
            if (req.body.password !== req.body.cpassword) {
                res.render('register', { message: 'Passwords are not matching.' });
                return;
            }

            if (null !== await User.findOne({ username: req.body.username }).exec()) {
                res.render('register', { message: 'Username taken.' });
                return;
            }
            if (null !== await User.findOne({ email: req.body.email }).exec()) {
                res.render('register', { message: 'Email taken.' });
                return;
            }

            const newUser = new User({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: createHash('sha256').update(req.body.password).digest('hex'),
                // creationTime: new Date(),  // default value allows that to be omitted
                admin: false
            });

            await newUser.save();
            res.redirect('/?message=' + 'Registration complete.');
        }
    });

    app.get('/logout', (req, res) => {  // temporarily get 
        if (req.session.userid) {
            req.session.destroy();
        }
        res.redirect('/');
    });

    app.get('/admin', (req, res) => {
        if (req.session.admin) {
            res.render('admin', { user: req.session.userid, admin: req.session.admin }); // TODO
        } else {
            res.redirect('/');
        }
    });

    app.post('/place-order', async (req, res) => {
        if (req.session.userid) {
            const user = await User.findOne({ username: req.session.userid }).exec();
            const newOrder = new Order({ user: user._id });  // totalPrice defaults to 0
            for (const name of req.session.cart) {
                const skin = await Skin.findOne({ name }).exec();
                if (skin.status) {
                    newOrder.skins.push(skin._id);
                    newOrder.totalPrice += skin.priceUsd;
                    skin.status = false;
                    skin.save();
                }
            }
            await newOrder.save();
            res.json('order placed, you monkey');
        } else {
            res.json('failed');
        }
    });

    app.post('/add-item/:name', (req, res) => {
        if (req.session.userid) {
            if (!req.session.cart.includes(req.params.name)) {
                req.session.cart.push(req.params.name);
                res.json('done');
                return;
            }
        }
        res.json('fail');
    });

    app.post('/remove-item/:name', (req, res) => {
        if (req.session.userid) {
            const id = req.session.cart.indexOf(req.params.name);
            if (id > -1) {
                req.session.cart.splice(id, 1);
                res.json('done');
                return;
            }
        }
        res.json('fail');
    });

    app.get('/cart', async (req, res) => {
        if (req.session.userid) {
            const response = [];
            for (const name of req.session.cart) {
                const skin = await Skin.findOne({ name }).lean().exec();
                if (skin === null) continue;
                response.push({
                    name: skin.name,
                    priceUsd: skin.priceUsd,
                    thumbnail: skin.thumbnail,
                    status: skin.status
                });
            }
            res.json(response);
            return;
        }
        res.json('fail');
    });

    app.get('/get-users', async (req, res) => {
        if (req.session.admin) {
            const users = await User.find({}).lean().exec();
            const result = [];
            for (const user of users) {
                result.push({
                    username: user.username,
                    name: user.name,
                    date: user.creationTime
                });
            }
            res.json(result);
        } else {
            res.json('fail');
        }
    });

    app.get('/get-orders', async (req, res) => {
        if (req.session.admin) {
            const orders = await Order.find().lean().exec();
            const result = [];
            for (const order of orders) {
                const user = await User.findById(order.user).lean().exec();
                const skins = [];
                for (const skinId of order.skins) {
                    skins.push(await Skin.findById(skinId).lean().exec());
                }
                result.push({
                    username: user.username,
                    email: user.email,
                    totalPrice: order.totalPrice,
                    skins
                });
            }
            res.json(result);
        } else {
            res.json('fail');
        }
    });

    http.createServer(app).listen(3000, () => {
        console.log('Server is running on port 3000.');
    });
})();
