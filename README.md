# Localink
Disover local, trusted services right within your neighborhood. Whether you are looking to fix a leaky faucet, pick a lock, to build a website or roofing service, Localink has you covered. 


## Screenshot

![alt text](https://github.com/tristenseng/localink/blob/main/docs/demo.png)


## Workers should be able to:
- Register/Login
- Set account visibility on or off
- Accept/reject jobs from employers
- Add skills


## Employers should be able to: 
- Register/Login
- Create an account
- Create a job/request
- Complete jobs in progress


## Installation

Run this command to get all the necessary packages.
```bash
npm install bcrypt, body-parser, connect-mongo, cors, crypto, ejs, express, express-session, mongodb, node
```


## Usage
Run this command to start the local server.
```bash
npm run dev
```

Then proceed to localhost:3001 on your browser of choice.


## Built with

- HTML5
- CSS
- Vanilla JS
- Express
- MongoDB



## What we learned

- (CSS) Do not add complex styling to commonly used tags. It created downstream effects to styles that forced me to use !important to everything is bad practice!

- (EJS) Very useful for sending data to get it to appear on HTML pages! Probably not as secure/reliable as other methods, but it is what we landed on for now.

- (MongoDB) Creating a mongodb schema to organize things helped immensely for keeping the backend manageable and easy to modify.

- (Express) Sessions are insecure. They should only be used for development and they should not go into a database. This goes against RESTful-ness. We should go with express-cookies next time.

- (Overall) Starting with a solid foundation of code is paramount to having an application that is easy to work with. Spending the time to setup the basics correctly is worth it.
