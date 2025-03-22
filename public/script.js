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

        // register with server the user after connecting
        // this registration is not like authentication
        socket.emit("register user", { 
          userId: currentUser.userId , 
          username: currentUser.username
        });
    });

    // listen for updates to connected user list
    socket.on('update user list', (usernames)=>{
        console.log('Connected users:', usernames); // Debugging: Log the list of users
        updateUserList(usernames);
    });

    // Listen for personal messages
    socket.on('personal message', (message) => {
         if (
           message.sender === selectedUserId ||
           message.receiver === selectedUserId
         ) {
           addMessage(
             `${message.senderUsername}: ${message.content}`,
             message.sender === currentUser.userId
           );
         }
    });

    // Listen for group messages
    socket.on('group message', (message) => {
        addMessage(message.content, false);
    });
}

// update the UI for user list 
function updateUserList(users) {
  const chatList = document.getElementById("chat-list");
  chatList.innerHTML = ""; // Clear the list

  users.forEach((user) => {
    if (user.username !== currentUser.username) {
      // Don't show the current user in the list
      const userDiv = document.createElement("div");
      userDiv.classList.add("chat-item");
      userDiv.textContent = user.username; // Display username

      // Add click event listener to the userDiv
      userDiv.addEventListener("click", () => {
        console.log("User selected:", user.username); // Debugging
        selectedUserId = user.userId; // Set the selected user's ID (ObjectId)
        selectedUsername = user.username; // Set the selected user's username
        document.getElementById("messages").innerHTML = ""; // Clear the chat area
        document.querySelector(
          ".chat-header h2"
        ).textContent = `Chat with ${user.username}`; // Update the chat header
      });

      chatList.appendChild(userDiv);
    }
  });
}

// function updateUserList(usernames){
//     const chatList = document.getElementById("chat-list");
//     chatList.innerHTML = ""; // Clear the list

//     usernames.forEach((username) => {
//       if (username !== currentUser.username) {
//         // Don't show the current user in the list
//         const userDiv = document.createElement("div");
//         userDiv.classList.add("chat-item");
//         userDiv.textContent = username; // Display username
//         userDiv.addEventListener("click", () => {
//           console.log("User selected:", username); // Debugging
//           selectedUserId = username; // Set the selected user
//           document.getElementById("messages").innerHTML = ""; // Clear the chat area
//           document.querySelector(
//             ".chat-header h2"
//           ).textContent = `Chat with ${username}`; // Update the chat header
//         });

//         chatList.appendChild(userDiv);
//       }
//     });
// }

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
      console.log("Sending message to:", selectedUserId); // Debugging
      console.log("Sender ID:", currentUser.userId); // Debugging
      console.log("Receiver ID:", selectedUserId); // Debugging
      socket.emit("personal message", {
        senderId: currentUser.userId,
        senderUsername: currentUser.username, // Include sender's username
        receiverId: selectedUserId,
        content: message,
      });
      addMessage(`${currentUser.username}: ${message}`, true); // Add sent message to the UI
      messageInput.value = "";
    } else {
      console.error("No user selected or message is empty"); // Debugging
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