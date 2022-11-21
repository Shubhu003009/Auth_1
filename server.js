const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const mongodbSession = require('connect-mongodb-session')(session);
const userModel = require('./models/userModel');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

// ---------------------------------------------------------------------

// MONGODB:
const mongoUri = 'mongodb://127.0.0.1:27017/Auth_1';
mongoose.connect(mongoUri, () => {
  console.log('DB Running...');
});

// ---------------------------------------------------------------------

// SETTINGS :
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------------------------------------------------

// MIDDLEWARES :
const PORT = 8000;
app.listen(PORT, () => console.log('Server running on http://localhost:8000'));

app.use(cors());

const store = new mongodbSession({
  uri: mongoUri,
  collection: 'mySession',
});

app.use(
  session({
    secret: 'lkaslkdjsadlkqoirymzxckjwad',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(flash());

// ---------------------------------------------------------------------

// AUTH MIDDLEWARES :

const isAuth = (req, res, next) => {
  if (req.session.user_id) {
    next();
  } else {
    res.redirect('/login');
  }
};

const isLoggedIn = (req, res, next) => {
  if (req.session.user_id) {
    return res.redirect('/dashboard');
  } else {
    next();
  }
};

// ---------------------------------------------------------------------

// FUNCTIONS :

// ---------------------------------------------------------------------

// ROUTES :
app.get('/', (req, res) => {
  res.render('landing');
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = new userModel({
      username,
      email,
      password: await bcrypt.hash(password, 12),
    });

    const user_data = await userModel.findOne({ email });

    if (user_data) {
      res.redirect('/register');
    } else {
      await user.save();
      req.flash('message', 'Registerd Successfully, Now Login !');
      res.redirect('register');
    }
  } catch (error) {
    res.send(error.message);
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.redirect('/login');
  } else {
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.user_id = user._id;
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  }
});

app.get('/register', (req, res) => {
  res.render('register', { message: req.flash('message') });
});
app.get('/login', isLoggedIn, (req, res) => {
  res.render('login');
});
app.get('/dashboard', isAuth, (req, res) => {
  res.render('dashboard');
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/');
  });
});
