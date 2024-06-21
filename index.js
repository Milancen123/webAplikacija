const express = require('express');
const app = express();
const pg = require('pg');
const session = require("express-session");
const cors = require('cors');
const morgan =  require('morgan');

const store = new session.MemoryStore();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(cors());
app.use(morgan('dev'));

app.use(
    session({
        secret: "abcefgg",
        resave: false,
        saveUninitialized: false,
        store,
    })
);


const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'loggingIN',
    password: 'postgres',
    port: 5432
});

const pool2 = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'carsharedb',
    password: 'postgres',
    port: 5432
})

const validateAuthentication = (req, res, next) => {
    const email = req.body.username;
    const password = req.body.password;
    

    pool.query('SELECT email, password FROM users WHERE email = $1', [email], (err, results) => {
        if(err) throw err;

        if(password == results.rows[0].password) {
            req.session.authenticated = true;
            req.session.user = {
                email,
                password,
            };

            res.redirect('/home');
        }else{
            res.send("Credentials are off");
        }
    })

}


const ensureAuthentication = (req, res, next) => {
    if(req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

const getDrivers = (req, res, next) => {
    pool2.query('SELECT * FROM registrations WHERE admited = false', (err, results) => {
        if(err) throw err;

        res.status(200).json(results.rows);
    })
}

const createDriver = (req, res, next) => {
    console.log(req.body);
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const car_model = req.body.car_model;
    const car_image = req.body.car_image;
    const bank_acc = req.body.bank_acc;
    const plate_number = req.body.plate_number;
    const email = req.body.email;
    const password = req.body.password;

    res.status(201);
    pool2.query('INSERT INTO driver (first_name, last_name, car_model, car_image, bank_acc, plate_number, email, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [first_name, last_name, car_model, car_image, bank_acc, plate_number, email,password], (error, results) => {
        if(error) throw error;
        res.status(201).json("OK");
    })
}

const updateDriver = (req, res, next) => {
    const email = req.body.email;
    pool2.query("UPDATE registrations SET admited = true WHERE email = $1", [email], (err, results) => {
        if(err) throw err;
        res.status(200).json("OK");
    })
}

const deleteDriversRegistration = (req, res, next) => {
    const email = req.body.email;
    console.log(email);
    pool2.query("DELETE FROM registrations WHERE email = $1", [email], (err, results) => {
        if(err) throw err;
        res.status(200).json("OK");
    })
}

app.get('/', (req, res, next) => {
    res.redirect('/login');
});

app.get('/login', (req, res, next) => {
    res.render('login');
});


app.get('/home', ensureAuthentication, (req, res, next) => {
    res.render('home', {userName: req.session.user.email});

})


app.get('/drivers', ensureAuthentication, getDrivers);
app.post('/drivers', ensureAuthentication, createDriver);
app.put('/drivers', ensureAuthentication, updateDriver);
app.delete('/drivers', ensureAuthentication, deleteDriversRegistration);

app.post('/login', validateAuthentication);


// DELETE /api/auth/logout
// DELETE /api/auth/logout
app.delete('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                // If there's an error destroying the session, send a 400 response
                res.status(400).send('Unable to log out');
            } else {
                // Redirect to the GET route /login
                res.redirect('/login');
            }
        });
    } else {
        // If no session exists, simply end the response
        res.end();
    }
});






app.listen(8000, ()=>{
    console.log("Server is listening on PORT 8000");
})

