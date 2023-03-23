// const messageTypes = { LEFT: 'left', RIGHT: 'right', LOGIN: 'login' };

// //Chat stuff
// const chatWindow = document.getElementById('chat');
// const messagesList = document.getElementById('messagesList');
// const messageInput = document.getElementById('messageInput');
// const sendBtn = document.getElementById('sendBtn');

// //login stuff
// let username = '';
// const usernameInput = document.getElementById('usernameInput');
// const loginBtn = document.getElementById('loginBtn');
// const loginWindow = document.getElementById('login');

// const messages = []; 

// // { author, date, content, type }

// //Connect to socket.io - automatically tries to connect on same port app was served from
// var socket = io();

// socket.on('connect', () => {
// 	console.log("id", socket.id)
// })


// socket.on('message', message => {
// 	console.log("id", message.id)

// 	//Update type of message based on username
// 	if (message.type !== messageTypes.LOGIN) {
// 		if (message.author === username) {
// 			message.type = messageTypes.RIGHT;
// 		} else {
// 			message.type = messageTypes.LEFT;
// 		}
// 	}

// 	messages.push(message);
// 	displayMessages();

// 	//scroll to the bottom
// 	chatWindow.scrollTop = chatWindow.scrollHeight;

// 	// alert(JSON.stringify(messages));
// });

// createMessageHTML = message => {
// 	if (message.type === messageTypes.LOGIN) {
// 		return `
// 			<p class="secondary-text text-center mb-2">${
// 				message.author
// 			} joined the chat...</p>
// 		`;
// 	}
// 	return `
// 	<div class="message ${
// 		message.type === messageTypes.LEFT ? 'message-left' : 'message-right'
// 	}">
// 		<div class="message-details flex">
// 			<p class="flex-grow-1 message-author">${
// 				message.type === messageTypes.LEFT ? message.author : 'You'
// 			}</p>

// 			<p class="message-date">${message.date}</p>
// 		</div>
// 		<p class="message-content">${message.content}</p>
// 	</div>
// 	`;
// };

// displayMessages = () => {
// 	const messagesHTML = messages
// 		.map(message => createMessageHTML(message))
// 		.join('');
// 	messagesList.innerHTML = messagesHTML;
// };

// sendBtn.addEventListener('click', e => {

// 	e.preventDefault();

// 	if (!messageInput.value) {

// 		return console.log('Invalid input');

// 	}

// 	const date = new Date();
// 	const month = ('0' + date.getMonth()).slice(0, 2);
// 	const day = date.getDate();
// 	const year = date.getFullYear();
// 	const dateString = `${month}/${day}/${year}`;

// 	const message = {
// 		author: username,
// 		date: dateString,
// 		content: messageInput.value
// 	};
// 	sendMessage(message);
// 	//clear input
// 	messageInput.value = '';
// });

// loginBtn.addEventListener('click', e => {
// 	console.log("hloooo")
// 	e.preventDefault();
// 	if (!usernameInput.value) {
// 		return console.log('Must supply a username');
// 	}

// 	//set the username and create logged in message
// 	username = usernameInput.value;
// 	sendMessage({ author: username, type: messageTypes.LOGIN });

// 	//show chat window and hide login
// 	loginWindow.classList.add('hidden');
// 	chatWindow.classList.remove('hidden');
// });

// sendMessage = message => {
// 	socket.emit('message', message);
// };



const socket = io();

const form = document.getElementById('chat-form');



form.addEventListener('submit', (event) => {
	console.log('hii')
	event.preventDefault();

	const data = {
		sender: form.sender.value,
		receiver: form.receiver.value,
		message: form.message.value,
	};

	socket.emit('chat message', data);

	form.reset();
});

socket.on('chat message', (data) => {
	const message = `${data.sender}: ${data.message}`;
	const li = document.createElement('li');
	li.innerText = message;
	document.getElementById('messages').appendChild(li);
});


