const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const _dirname = path.resolve();

// Set up Express app
const app = express();
const port = 5000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files (CSS, images, etc.)
app.use(express.static('public'));

const session = require('express-session');

app.use(session({
    secret: 'B3st3r@3126',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/balanceSheet', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log('Error connecting to MongoDB: ', err));

// Define User Schema
let userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Totalincome: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
    business: { type: Number, default: 0 },
    grant: { type: Number, default: 0 },
    otherIncome: { type: Number, default: 0 },
    Totalexpense: { type: Number, default: 0 },
    loans: { type: Number, default: 0 },
    groceries: { type: Number, default: 0 },
    rent: { type: Number, default: 0 },
    utilities: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    otherExpense: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    balanceText: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

app.use((req, res, next) => {
    res.locals.username = req.session.user ? req.session.user.username : null;
    next();
});

// Home Route
app.get('/', (req, res) => {
    res.sendFile(path.join(_dirname, 'views', 'login.html'));
});

// Register Route
app.get('/register', (req, res) => {
    res.sendFile(path.join(_dirname, 'views', 'register.html'));
});

app.get('/index', (req, res) => {
    if(!req.session.user) {
        return res.redirect('/');
    }
     const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.sendFile(path.join(_dirname,'views','index.html'));
});

app.get('/income', (req, res) => {
    if(!req.session.user) {
        return res.redirect('/');
    }
    
    res.sendFile(path.join(_dirname,'views','income.html'));
});

app.get('/expense', (req, res) => {
    if(!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(_dirname,'views','expense.html'));
});

app.get('/balance', (req, res) => {
    if(!req.session.user) {
        return res.redirect('/');
    }

    res.sendFile(path.join(_dirname,'views','balance.html'));
});

// Login Validation Route
app.post('/login', async (req, res) => {
    let { username, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ username: username });
    if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user._id, username: user.username };
            console.log('Session set: ', req.session.user);
            return res.redirect('/index');
        } else {
            return res.sendFile(path.join(_dirname, 'views', 'login.html'), { error: 'Incorrect password' });
        }
    } else {
        return res.sendFile(path.join(_dirname, 'views', 'login.html'), { error: 'User not found' });
    }
});

// Register User Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if username already exists
    const userExists = await User.findOne({ username: username });
    if (userExists) {
         return res.sendFile(path.join(_dirname, 'views', 'register.html'), { error: 'Username already taken' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.redirect('/');
});
// index Route
app.get('/index', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.sendFile(path.join(_dirname, 'views', 'index.html'), );
});
app.post('/index', (req, res) => {
    let { action } = req.body;

    if (!req.session.user) {
        console.log('User not logged in');
        return res.redirect('/login');
    }
   
    if (action === 'income') {
        res.redirect('/income');
    } else if (action === 'expense') {
        res.redirect('/expense');
    } else if (action === 'balance') {
        res.redirect('/balance');
    } else {
        res.redirect('/index', {error: 'Invalid action'});
    }
    
});

app.post('/income', async (req, res) => {
    let { salary, business, grant, otherIncome } = req.body;
     
    if (!req.session.user) {
        return res.redirect('/');
    }

    // Example: Save income and source to the database
    let user = await User.findOne({ username: req.session.user.username });
    if (user) {
        user.salary = Number(salary) || 0;
        user.business = Number(business) || 0;
        user.grant = Number(grant) || 0;
        user.otherIncome = Number(otherIncome) || 0;
        
        let income = user.salary + user.business + user.grant + user.otherIncome;
        user.Totalincome = income; // Update income in the database
        
        await user.save();
        req.session.successMessage = 'Income saved successfully';
        res.redirect('/index'); // Redirect to index after saving
    } else {
        console.log('User not found');
        res.redirect('/income', {error: 'User not found'});
    }
});

app.post('/expense', async (req, res) => {
    let { loans, rent, utilities, groceries, transportation, otherExpense  } = req.body;

    // Example: Save expense and category to the database
    let user = await User.findOne({ username: req.session.user.username });
    if (user) {
        user.loans = Number(loans) || 0;
        user.rent = Number(rent) || 0;
        user.utilities = Number(utilities) || 0;
        user.groceries = Number(groceries) || 0;
        user.transportation = Number(transportation) || 0;
        user.otherExpense = Number(otherExpense) || 0;

        let expense = user.loans + user.rent + user.utilities + user.groceries + user.transportation + user.otherExpense;
        user.Totalexpense = expense; // Update expense in the database

        await user.save();
        req.session.successMessage = 'Expenses saved successfully';
        res.redirect('/index'); // Redirect to index after saving
    } else {
        console.log('User not found');
        res.redirect('/expense', {error: 'User not found'});
    }
});

app.post('/balance', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    let user = await User.findOne({ username: req.session.user.username });
    if (user) {
        let balance = user.Totalincome - user.Totalexpense;
        user.balance = balance; // Update balance in the database

        if (balance < 0.25 * user.Totalincome) {
            req.session.Message = 'Warning: Balance is less than 25% of total income, please consider reducing unnecessary expenses.';
        } else if (balance > 0.5 * user.Totalincome) {
            req.session.Message = 'Good job! Your balance is more than 50% of your total income. Your savings are on track.';
        } else {
            req.session.Message = 'Your balance is within the normal range [25%-50%]. You are managing your finances well.';
        }
        user.balanceText = req.session.Message;
        await user.save();

        return res.json({ success: true, balance, balanceText: user.balanceText });
    } else {
        console.log('User not found');
        return res.status(404).json({ success: false, message: 'User not found' });
    }
});

app.get('/api/userinfo', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user.username });
    } else {
        res.status(401).json({ username: null });
    }
});

app.get('/api/success-message', (req, res) => {
    if (req.session.successMessage) {
        res.json({ message: req.session.successMessage });
    } else {
        res.json({ message: null });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
