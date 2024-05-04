const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo')
const port = process.env.PORT || 3001;
const crypto = require('crypto');
const { connect } = require('http2');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
const secret = crypto.randomBytes(64).toString('hex');
const uri = 'mongodb+srv://tristenseng:backpack@cluster0.bis7cwk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: uri}),
    cookie: {secure:false, maxAge: 1000 * 30 } //30 sec duration
}));


const client = new MongoClient(uri)

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
})

app.get('/home-worker', (req, res) => {
    res.sendFile(__dirname + '/public/home/worker.html')
})

app.get('/home-employer', (req, res) => {
    res.sendFile(__dirname + '/public/home/employer.html')
})

app.get('/logout', async (req, res) => {
    try {
        req.session.destroy()
    }
    catch (err) {
        console.error('error logging out: ', err)
    }
    res.redirect('/login')
})

app.get('/skills', (req, res) => {
    res.sendFile(__dirname + '/public/worker/skills.html')
})

app.get('/skillsArray', async (req, res) => {
    try {
        const db = await client.connect();
        const collection = db.collection('skills')
        const skills = await collection.find({}).toArray();
        res.json(skills)
    }
    catch (err) {
        res.status(500).send(err);
    }
})

app.get('/location-worker', async (req,res) => {
    console.log(req.session.user)
    res.sendFile(__dirname + '/public/worker/location-worker.html')
})

app.post('/location-worker', async (req, res) => {
    try { 
        await client.connect();
        const database = client.db('test');
        const workers = database.collection('workers');
        const worker = await workers.findOne({email: req.session.user.email})
        console.log('in location-worker')
        console.log(worker)
        const location = `${req.body.city}, ${req.body.state}`
        const d = Date(Date.now()).toString()
        await workers.updateOne(worker, {$set: {location: location, lastLogin: d}})
        res.redirect('/skills')
    }
    catch (err) {
        console.log(err)
    }

})

app.post('/register', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('test');
        const employer = database.collection('employers');
        const worker = database.collection('workers');
        const hashPass = await bcrypt.hash(req.body.password, 10);
        const time = new Date().getTime();
        var objectid = ObjectId.createFromTime(time).toString().substring(0,8)
        const selectedRole = req.body.role

    
        if (selectedRole == "worker") {
            const workerUser = {
                workerid: objectid,
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                phoneNumber: req.body.phonenumber,
                email: req.body.email,
                password: hashPass,
                lastLogin: null
            };
            await worker.insertOne(workerUser)
            res.redirect('/login')
        }

        else {
            const employerUser = {
                employerid: objectid,
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                phoneNumber: req.body.phonenumber,
                email: req.body.email,
                password: hashPass,
                lastLogin: null
            };
            await employer.insertOne(employerUser)
            res.redirect('/login')
        }

    }
    catch (err) {
        console.error(err);
        res.redirect('/register')
    } finally {
        await client.close();
    }
});


app.post('/login', async (req,res) => {
    try {
        await client.connect();
        const database = client.db('test');
        const employers = database.collection('employers');
        const workers = database.collection('workers');
        const employer = await employers.findOne({ email: req.body.email });
        const worker = await workers.findOne({ email: req.body.email });

        var pass = "";
        if (employer) {
            pass = employer.password
        }
        else {
            pass = worker.password
        }
        const match = await bcrypt.compare(req.body.password, pass)
        if (employer && match) {
            console.log("employer login success")
            req.session.user = employer
            if(lastLogin = "") {
                res.redirect('/location-employer')
            }
            res.redirect('/home-employer')
        }
        else if (worker && match) {
            console.log("worker login success")
            req.session.user = worker
            console.log(req.session.user)
            req.session.save()
            if(!worker.lastLogin) {
                res.redirect('/location-worker')
            }
            else {
                res.redirect('/home-worker')
            }

        }
        else {
            console.log("login unsuccessful")
            res.redirect('/login')
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