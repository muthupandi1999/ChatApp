// const http = require("http");
const express = require("express");

const logger = require("morgan");

const cors = require("cors");

const app = express();

const path = require('path')

const http = require('http');

const { writeFile } = require("fs");

const { createServer } = require("http");

const { Server } = require("socket.io");

const server = createServer(app);

const io = new Server(server, { maxHttpBufferSize: 1e8 });

const bcrypt = require('bcryptjs')

const ChatMessage = require('./models/messageSchema');

const User = require('./models/User');

// mongo connection

const mongoose = require("mongoose");

const { decode } = require('./middlewares/jwt');

const Message = require('./models/messageSchema');

const uuid = require('uuid');

/** Get port from environment and store in Express. */
const port = process.env.PORT || "4000";

app.set("port", port);

app.use(logger("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

//Serve public directory
app.use(express.static('public'));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/login.html');
// });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
})
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});


mongoose.set('strictQuery', false)

mongoose.connect('mongodb://localhost:27017/ChatApp-Socket', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
    console.log('Mongo has connected succesfully')
})
mongoose.connection.on('reconnected', () => {
    console.log('Mongo has reconnected')
})
mongoose.connection.on('error', error => {
    console.log('Mongo connection has an error', error)
    mongoose.disconnect()
})
mongoose.connection.on('disconnected', () => {
    console.log('Mongo connection is disconnected')
})

/** catch 404 and forward to error handler */
app.use('*', (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API endpoint doesnt exist'
    })
});

const users = {};

const clients = [];

// console.log("clients", clients)
// console.log("activeusers", users)

io.on('connection', (socket) => {


    var socketInfo = [];

    socket.on('join', (username) => {
        console.log(`${username} joined`);
        socket.username = username;
        socketInfo.push({ id: socket.id, username });

        socket.emit('socketInfo', socketInfo)
    });


    // function generateUsername() {
    //     return `user_${uuid.v4()}`;
    // }

    // var socketInfo;


    // socket.on('login', function (data) {

    //     socket.username = generateUsername();

    //     // send the socket ID and username to the client
    //     socket.emit('socket info', { id: socket.id, username: socket.username });

    //     // get a list of all connected sockets and their info

    //     const socketIds = [...io.sockets.sockets.keys()];

    //     console.log("activeId", socketIds);

    //     socketInfo = socketIds.map((id) => {
    //         const socket = io.sockets.sockets.get(id);
    //         const username = socket.username; // assuming username is a property of the socket object
    //         return { id, username };
    //     });

    //     // const socketInfo = socketIds.map((s) => ({
    //     //     id: s.id,
    //     //     username: s.username
    //     // }));


    //     // send the list of socket info to the client
    //     socket.emit('all sockets', socketInfo);

    //     // console.log('a user ' + data.userId + ' connected');

    //     // saving userId to object with socket ID
    //     users.socketId = data.userId;

    //     clients.push(data.userId)

    //     // console.log("clientdt", clients)

    //     // console.log("users", users)

    // });



    // console.log(" socket.join(socket.userID);", socket.join(socket.userID));

    var userNames = {};

    socket.on('setSocketId', (data) => {

        // console.log("data", data);

        var userName = data.name;

        var userId = data.userId;

        userNames.userName = userName;

        userNames.userId = userId;

        // console.log("user", userNames)


    });

    // console.log("username", userNames)

    // console.log("id", socket.id);

    socket.on("connect_error", (err) => {

        console.log(`connect_error due to ${err.message}`);

    });


    // socket.on('chat message', (data) => {
    //     const message = new ChatMessage({
    //         sender: data.sender,
    //         receiver: data.receiver,
    //         message: data.message,
    //     });

    //     message.save()
    //         .then(data => {
    //             io.emit('chat message', data);

    //         })
    //         .catch(err => {
    //             console.error(err);
    //         });

    // });

    socket.on('register', async (data) => {

        // console.log("data", data)

        const { username, email, password } = data;

        const hashPassword = await bcrypt.hashSync(password, 10)

        const user = await new User({
            username: username,
            email: email,
            password: hashPassword
        });

        try {

            // console.log("saved", user)
            await user.save();
            socket.emit('register success');

        } catch (error) {

            socket.emit('register failure');

        }

    });

    socket.on('login', async (data) => {

        // console.log("data", data)

        const { email, password } = data;

        const emailExists = await User.findOne({ email: email });

        if (emailExists) {

            const validPassword = await bcrypt.compare(password, emailExists.password);

            if (validPassword) {

                socket.emit('login success');

                var distination = `/home.html?username=${emailExists.username}`;

                // console.log("emailex", emailExists)

                // socket.emit('user dt', emailExists);

                socket.emit('redirect', distination);

            } else {

                socket.emit('login failure');

            }
        } else {

            socket.emit('login failure');

        }

    });

    socket.on('newuser', function (uname) {

        username = uname;

        socket.broadcast.emit('update', uname + " Joined the conversation");

    })

    socket.on('exituser', function (uname) {

        socket.broadcast.emit('update', uname + " left the conversation");

    })

    socket.on('chat', async function (message) {

        const message_ = await new ChatMessage({

            message: message.text,
            sender: message.username

        });

        // console.log("ActiveUsers", users)

        try {

            // console.log("saved", message)
            await message_.save();

        } catch (error) {

            throw err

        }

        socket.broadcast.emit('chat', message)
    })

    socket.on('base64 file', async (msg) => {

        // console.log("msg", msg)

        // console.log("msg.fileName", msg.fileName)

        const buffer = Buffer.from(msg.file, 'base64');

        writeFile(`public/${msg.fileName}`, buffer, (err) => {

            if (err) {
                console.log(err)
            }
            // console.log("success")


        });

        var chats_ = await new ChatMessage({
            sender: msg.username,
            file: msg.fileName
        })

        // console.log("Chats", chats_)

        try {
            // console.log("saved", message)
            await chats_.save();



        } catch (error) {
            throw err
        }

        await socket.broadcast.emit('base64 file', msg.file);

    });

});

/** Create HTTP server. */

/** Create socket connection */
// global.io = socketio.listen(server);
// global.io.on('connection', WebSockets.connection)
/** Listen on provided port, on all network interfaces. */
server.listen(port);
/** Event listener for HTTP server "listening" event. */
server.on("listening", () => {
    console.log(`Listening on port:: http://localhost:${port}/`)
});