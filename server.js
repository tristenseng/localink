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
const { parse } = require('path');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs')
const secret = crypto.randomBytes(64).toString('hex');
const uri = 'mongodb+srv://tristenseng:backpack@cluster0.bis7cwk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: uri,  ttl: 5 * 60, autoRemove: 'native'}),
    cookie: {secure:false, maxAge: 1000 * 60 * 5 } //5 minutes
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


app.get('/logout', async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Properly handle the error
            console.log("Session destroy failed:", err);
            return res.status(500).send("Failed to destroy the session");
        }

        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/login'); // Redirect to login or home page
    });
})



app.get('/profile-worker', (req, res) => {
    res.sendFile(__dirname + '/public/worker/profile-worker.html')
})

app.get('/skills', (req, res) => {
    res.sendFile(__dirname + '/public/worker/skills.html')
})

//send to the skills page on worker account
app.get('/skills-worker', async (req, res) => {
    res.sendFile(__dirname + '/public/worker/skills-worker.html')
})


//get array of skills from worker session
app.get('/workerskills', async (req, res) => {
    try {
        await client.connect()
        const db = client.db('test')
        const collection = db.collection('workerskills')
        const data = await collection.find({workerid: req.session.user.workerid}).toArray()
        console.log(data)

        res.send(data)
    } catch (err) {
        res.status(500).send(err)
    }
})



app.get('/skillsArray', async (req, res) => {
    try {
        await client.connect()
        const db = client.db('test')
        const collection = db.collection('skills')
        const data = await collection.find().toArray()
        //console.log(data)

        res.send(data)
    }
    catch (err) {
        res.status(500).send(err);
    }
})

app.get('/location-worker', async (req,res) => {
    res.sendFile(__dirname + '/public/worker/location-worker.html')
})

app.post('/toggleVisibility', async (req, res) => {
    await client.connect();
    const database = client.db('test');
    const workers = database.collection('workers')
    const worker = await workers.findOne({email: req.session.user.email})
    if (worker.visibility) {
        await workers.updateOne(worker, {$set: {visibility: false}})
    }
    else {
        await workers.updateOne(worker, {$set: {visibility: true}})
    }
    res.send(worker)

})

app.post('/home-worker', (req, res) => {
    res.redirect('/home-worker')
})

app.post('/location-worker', async (req, res) => {
    try { 
        await client.connect();
        const database = client.db('test');
        const workers = database.collection('workers');
        const worker = await workers.findOne({email: req.session.user.email})
        // console.log('in location-worker')
        // console.log(worker)
        const location = `${req.body.city}, ${req.body.state}`
        const d = Date(Date.now()).toString()
        await workers.updateOne(worker, {$set: {location: location, lastLogin: d}})
        res.redirect('/skills')
    }
    catch (err) {
        console.log(err)
    }

})

app.post('/skills', async (req, res) => {
    try {
        await client.connect();
        //console.log('yea')
        const database = client.db('test');
        const workerskills = database.collection('workerskills');
        const worker = req.session.user
        //console.log(req.session.user)
        const workerskill = {
            workerid: worker.workerid,
            experience: req.body.experience,
            skillname: req.body.skillname,
            preferredrate: parseInt(req.body.preferredRate)
        }
        //console.log(workerskills)
        await workerskills.insertOne(workerskill)
        res.redirect('/skills')
    }
    catch (err) {
        throw (err)
    }
});

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
                visibility: false,
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
        console.log(match)
        if (employer && match) {
            console.log("employer login success")
            req.session.user = employer
            if(!employer.lastLogin) {
                res.redirect('/location-employer')
            }
            else {
                res.redirect('/home-employer')
            }

        }
        else if (worker && match) {
            console.log("worker login success")
            req.session.user = worker
            //console.log(req.session.user)
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



/*employer stuff*/
app.get('/location-employer', async (req,res) => {
    res.sendFile(__dirname + '/public/employer/location-employer.html')
})

app.post('/home-employer', (req, res) => {
    res.redirect('/home-employer')
})

app.get('/home-employer', (req, res) => {
    res.sendFile(__dirname + '/public/home/employer.html')
})

app.get('/jobPosting', (req, res) => {
    res.sendFile(__dirname + '/public/employer/jobPosting.html')
})

app.get('/potential-workers', (req, res) => {
    res.sendFile(__dirname + '/public/employer/potential-workers.html')
})

app.post('/location-employer', async (req, res) => {
    try { 
        await client.connect();
        const database = client.db('test');
        const employers = database.collection('employers');
        const employer = await employers.findOne({email: req.session.user.email})
        console.log('in location-worker')
        //console.log(employer)
        const location = `${req.body.city}, ${req.body.state}`
        const d = Date(Date.now()).toString()
        await employers.updateOne(employer, {$set: {location: location, lastLogin: d}})
        res.redirect('/home-employer')
    }
    catch (err) {
        console.log(err)
    }

})

app.post('/createJob', async (req, res) => {
        await client.connect();
        const database = client.db('test');
        const jobs = database.collection('jobs');
        const time = new Date().getTime();
        var objectid = ObjectId.createFromTime(time).toString().substring(0,8)
        const job = {
            jobid: objectid,
            employerid: req.session.user.employerid,
            description: req.body.description,
            duration: parseInt(req.body.duration),
            skillRequired: req.body.skillRequired,
            status: 'pending',
            completed: false
        }
        await jobs.insertOne(job)
        res.redirect('/jobPosting')

})

app.get('/jobsArray', async (req, res) => {
    try {
        await client.connect()
        const db = client.db('test')
        const collection = db.collection('jobs')
        const data = await collection.find({employerid: req.session.user.employerid}).toArray()
        const filteredData = data.filter(job => job.workerid == null)
        //console.log(filteredData)

        res.send(filteredData)
    }
    catch (err) {
        res.status(500).send(err);
    }
})

app.get('/requests', async (req, res) => {
    res.sendFile(__dirname + "/public/employer/requests.html")
})


app.post('/potentialworkers', async (req, res) => {
    try {
        await client.connect()
        const db = client.db('test')
        const workerskills = db.collection('workerskills')
        const workers = db.collection('workers')
        const jobs = db.collection('jobs')
        const jobid = req.body.jobname;
        const job = await jobs.findOne({jobid: jobid }) //finds the job
        const jobSkill = job.skillRequired // skills required for the job
        //console.log(jobSkill)
        const workerskillsearch = workerskills.find({skillname: jobSkill})
        const workerskill = await workerskillsearch.toArray() //all workerskills with the correct skillname
        var workerArray = []
        const agg = [
            {
              '$lookup': {
                'from': 'workerskills', 
                'localField': 'workerid', 
                'foreignField': 'workerid', 
                'as': 'result'
              }
            }
          ];
        const cursor = workers.aggregate(agg);
        const result = await cursor.toArray();
        //console.log(result)
        result.forEach(worker => {
            //console.log(worker)
            worker.result.forEach(item => {
                //console.log(item)
                //if worker has the appropriate skill for the job and has visibility
                if ((item.skillname == jobSkill) && worker.visibility) {
                    const neededWorker = {
                        jobid: req.body.jobname,
                        workerid: worker.workerid,
                        firstname: worker.firstName,
                        lastname: worker.lastName,
                        experience: item.experience,
                        preferredrate: item.preferredrate,
                        skillname: item.skillname
                    }
                    workerArray.push(neededWorker)
                }
            })
        })
        //console.log(workerArray)

        res.render('potential-workers', {workers: workerArray, skillname: jobSkill})
    } catch (err) {
        res.status(500).send(err)
    }
})

app.get('/potentialworkers', async (req, res) => {
    res.sendFile(__dirname + "/public/employer/potential-workers.html")
})

app.post('/requestworker', async (req, res) => {
    const db = client.db('test')
    const workers = db.collection('workers')
    const jobs = db.collection('jobs')
    const workerInfo = JSON.parse(req.body.worker)
    const job = await jobs.findOne({jobid: workerInfo.jobid})
    const worker = await workers.findOne({workerid: workerInfo.workerid})
    console.log(job)
    console.log(worker)
    await jobs.updateOne(job, {$set: {workerid: worker.workerid, status: "pending"}})
    res.redirect('/requests')
})

app.listen(port, () => console.log(`Server running on port ${port}`));