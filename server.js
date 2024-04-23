const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const uri = 'mongodb+srv://tristenseng:backpack@cluster0.bis7cwk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const client = new MongoClient(uri)

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
})

app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html')
})


app.post('/register', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('cluster0');
        const users = database.collection('users');
        const newUser = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        };
        const result = await users.insertOne(newUser);
        res.redirect('/login')
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error registering user")
    } finally {
        await client.close();
    }
});

app.post('/login', async (req,res) => {
    try {
        await client.connect();
        const database = client.db('cluster0');
        const users = database.collection('users');
        const user = await users.findOne({ email: req.body.email });

        if (user && user.password == req.body.password) {
            res.redirect('/home')
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error")
    } finally {
        await client.close();
    }
})

app.listen(port, () => console.log(`Server running on port ${port}`));