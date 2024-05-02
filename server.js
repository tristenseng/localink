const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
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
        const database = client.db('test');
        const employer = database.collection('employers');
        const worker = database.collection('workers');
        const hashPass = await bcrypt.hash(req.body.password, 10);
        const time = new Date().getTime();
        var objectid = ObjectId.createFromTime(time);
        const selectedRole = req.body.role


        if (selectedRole == "worker") {
            const workerUser = {
                workerid: objectid.toString(),
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                phoneNumber: req.body.phonenumber,
                email: req.body.email,
                password: hashPass
            };
            await worker.insertOne(workerUser)
        }
        else {
            const employerUser = {
                employerid: objectid.toString(),
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                phoneNumber: req.body.phonenumber,
                email: req.body.email,
                password: hashPass
            };
            await employer.insertOne(employerUser)
        }
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
        const database = client.db('test');
        const employers = database.collection('employers');
        const workers = database.collection('workers');
        const employer = await employers.findOne({ email: req.body.email });
        const worker = await workers.findOne({ email: req.body.email });
        const pass = worker.password

        const match = await bcrypt.compare(req.body.password, pass)
        if (employer) {
            console.log("employer login success")
            res.redirect('/home')
        }
        else if (worker && match) {
            console.log("worker login success")
            res.redirect('/home')
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