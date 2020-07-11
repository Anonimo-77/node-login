const express = require('express');
const app = express();
const server = require('http').Server(app);
const path = require('path');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/myLogin', {
    useUnifiedTopology: true,
    useNewUrlParser: true
});
const bcrypt = require('bcrypt');
const io = require('socket.io')(server);

app.use(express.json());
app.use(express.urlencoded());

const User = require('./models/User');
io.sockets.on('connection', (socket) => {
    console.log('socket', socket.id);
    socket.on('deleteAccount', (id) => {
        console.log(id);
        User.deleteOne({_id: id}, (err,doc) => {
            console.log(err);
        });
    });
});

app.get('/', (req,res) => {

    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/register', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.post('/register', (req,res) => {
    const { name, user, pass, rpass } = req.body;
    if (pass == rpass) {
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, (err,salt) => {
            bcrypt.hash(pass, salt, (err, encpass) => {
                let newuser = new User({
                    fullName: name,
                    username: user,
                    password: encpass
                });
                newuser.save();
            });
        });
        res.redirect('/');
    }   
});

app.get('/login', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.post('/login', (req,res) => {
    User.findOne({ username: req.body.user }, (err, result) => {
        if (err) throw err;
        bcrypt.compare(req.body.pass, result.password, (err2,matches) => {
            if (err2) {
                console.error(err2);
            } else {
                if (matches) {
                    res.redirect('/session/?id='+result._id);
                } else {
                    res.redirect('/login');
                }
            }

        });
    });
});
app.get('/session', (req,res) => {
    User.findOne({_id: req.query.id}, (err, result) => {
        res.send(`
        <html>
            <head>
                <script src="/socket.io/socket.io.js"></script>
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
                <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
                <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
            </head>
            <body>
                <h1>Hello ${result.fullName}</h1>
                <h2>Welcome to your account of ${result.username}.</h2>
                <a href="/../">Log out</a>
                <br>
                <button class="btn btn-danger" onclick="deleteAccount()">Delete that account</button>
                <script>
                    var socket = io();
                    function deleteAccount() {
                        id = "${result._id}";
                        if(confirm("Are you sure to delete your account?")) {
                            socket.emit('deleteAccount', id);
                            console.log(id);
                            location.href = "http://localhost:8090/";
                        }
                        
                    }
                </script>    
            </body>
        </html>
    `);
    });
    
});
server.listen(8090, () => {
    console.log('Server on port 8090');
});