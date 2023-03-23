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
// socket configuration
// import WebSockets from "./server/utils/WebSockets";

// const WebSockets = require('./server/utils/WebSockets')
// const indexRouter = require('./server/utils/WebSockets')
// const userRouter = require('./server/utils/WebSockets')
// const chatRoomRouter = require('./server/utils/WebSockets')
// routes
// import indexRouter from "./server/routes/index";
// const userRouter = require("./routes/User");

// const loginRouter = require('./routes/login');

// const chatRoomRouter = require('./routes/room');

// const messageRouter = require('./routes/message')

const { decode } = require('./middlewares/jwt');

const Message = require('./models/messageSchema')

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

// app.use(myMiddleware);

// app.use("/login", loginRouter);
// app.use("/users", userRouter);
// app.use("/room", decode, chatRoomRouter);
// app.use("/message", decode, messageRouter);
// app.use("/delete", deleteRouter);

mongoose.set('strictQuery', false)

// mongoose.connect('mongodb://localhost:27017/Chat-Socket', err => {
//     if(err)   console.log("DB is not connected")
//     console.log("DB is connected")
// })


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

io.on('connection', (socket) => {

    console.log("id", socket.id);

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // socket.on('message', message => {
    //     console.log('message: ' + message);
    //     //Broadcast the message to everyone
    //     io.emit('message', message);
    // });

    socket.on('chat message', (data) => {
        const message = new ChatMessage({
            sender: data.sender,
            receiver: data.receiver,
            message: data.message,
        });

        message.save()
            .then(data => {
                io.emit('chat message', data);
            })
            .catch(err => {
                console.error(err);
            });

    });

    socket.on('register', async (data) => {

        console.log("data", data)
        const { username, email, password } = data;

        const hashPassword = await bcrypt.hashSync(password, 10)
        const user = await new User({
            username: username,
            email: email,
            password: hashPassword
        });
        try {
            console.log("saved", user)
            await user.save();
            socket.emit('register success');
        } catch (error) {
            socket.emit('register failure');
        }
    });

    socket.on('login', async (data) => {

        console.log("data", data)
        const { email, password } = data;

        const emailExists = await User.findOne({ email: email });

        if (emailExists) {

            const validPassword = await bcrypt.compare(password, emailExists.password);

            if (validPassword) {

                // var userName = emailExists.username

                socket.emit('login success');

                // const response = JSON.stringify({ type: 'username', userName });
                // socket.send(response);



                // socket.emit('UserDt', userName)

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
        try {
            // console.log("saved", message)
            await message_.save();

        } catch (error) {
            throw err
        }


        socket.broadcast.emit('chat', message)
    })



    //Upload


    // socket.on("upload", (file, callback) => {
    //     console.log(file); // <Buffer 25 50 44 ...>

    //     // save the content to the disk, for example
    //     writeFile("public/upload.png", file, (err) => {
    //         callback({ message: err ? "failure" : "success" });
    //     });
    // });

    socket.on('base64 file', async (msg) => {

        console.log("msg", msg)
        console.log("msg.fileName", msg.fileName)
        // Emit the file contents to all clients

        // let extension = msg.file.split(';')[0].split('/')[1]

        // socket.emit('base64 file', msg.file);

        const buffer = Buffer.from(msg.file, 'base64');

        writeFile(`public/${msg.fileName}`, buffer, (err) => {

            if (err) {
                console.log(err)
            }
            console.log("success")


        });

        var chats_ = await new ChatMessage({
            sender: msg.username,
            file: msg.fileName
        })

        console.log("Chats", chats_)

        try {
            // console.log("saved", message)
            await chats_.save();



        } catch (error) {
            throw err
        }

        await socket.broadcast.emit('base64 file', msg.file);





        // socket.broadcast.emit('base64 file', msg.file);

    });

    // socket.on('base64 file', function (msg) {
    //     console.log("msg", msg)
    //     // console.log('received base64 file from' + msg.username);
    //     // socket.username = msg.username;
    //     // socket.broadcast.emit('base64 image', //exclude sender
    //     // io.sockets.emit('base64 file',  //include sender

    //     //     {
    //     //       file: msg.file,
    //     //       fileName: msg.fileName
    //     //     }

    //     // );


    //     // socket.broadcast.emit('base64 file', msg.file)

    //     io.sockets.emit('base64 file',  msg.file); //include sender
    // });

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