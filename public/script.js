const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const createGroupButton = document.getElementById('createGroupButton');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const chatList = document.getElementById('chat-list');

let socket;
let currentUser;
let selectedUserId = null;

// Connect to Socket.IO server
function connectSocket() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to server');

        // register the user after connecting
        socket.emit('register user', currentUser.userId);
    });

    // listen for updates to connected user list
    socket.on('update user list', (users)=>{
        console.log('Connected users:', users); // Debugging: Log the list of users
        updateUserList(users);
    });

    // Listen for personal messages
    socket.on('personal message', (message) => {
        if(message.sender === selectedUserId || message.receiver === selectedUserId) {
            addMessage(message.content, message.sender === currentUser.userId);
        }
    });

    // Listen for group messages
    socket.on('group message', (message) => {
        addMessage(message.content, false);
    });
}

// update the UI for user list 
function updateUserList(users){
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML= '';         // clear the list

    users.forEach(userId=> {
        if(userId !== currentUser.userId) {
            // dont show the current user in the list
            const userDiv = document.createElement('div');
            userDiv.classList.add('chat-item');
            userDiv.textContent= userId;    // replace with username if available
            userDiv.addEventListener('click', ()=>{
                selectedUserId = userId;
                document.getElementById('message').innerHTML='';
                document.querySelector('.chat-header h2').textContent = `Chat with ${userId}`;
            });
            chatList.appendChild(userDiv);
        }
    })
}

// Add a message to the chat UI
function addMessage(text, isSent) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isSent ? 'sent' : 'received');
    messageDiv.innerHTML = `<p>${text}</p>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
}

// Login
loginButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        currentUser = { username, token: data.token, userId: data.userId };
        authContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        connectSocket();

        // Emit the "register user" event after connecting
        socket.emit('register user', currentUser.userId);
    } else {
        alert(data.error);
    }
});

// Register
registerButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert('Registration successful. Please login.');
    } else {
        alert(data.error);
    }
});

// Send Message
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && selectedUserId) {
        socket.emit('personal message', { 
            senderId: currentUser.userId, 
            receiverId: selectedUserId, 
            content: message 
        });
        addMessage(message, true);
        messageInput.value = '';
    }
});

// Create Group
createGroupButton.addEventListener('click', async () => {
    const groupName = prompt('Enter group name:');
    if (groupName) {
        const response = await fetch('/group/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: groupName, adminId: currentUser.username }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(`Group "${groupName}" created successfully!`);
        } else {
            alert(data.error);
        }
    }
});