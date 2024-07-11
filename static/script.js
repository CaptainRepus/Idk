document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');

    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        // Create div element for the message
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'sent');

        const messageParagraph = document.createElement('p');
        messageParagraph.innerText = messageText;

        const timestampSpan = document.createElement('span');
        const currentTime = new Date();
        timestampSpan.innerText = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timestampSpan.classList.add('timestamp');

        messageDiv.appendChild(messageParagraph);
        messageDiv.appendChild(timestampSpan);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        messageInput.value = '';
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    // Check if the user is already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const username = localStorage.getItem('username');
        if (username && (window.location.pathname === '/login' || window.location.pathname === '/')) {
            window.location.href = `/welcome_user?username=${username}`;
        }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const pin = document.getElementById('pin').value;
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `pin=${pin}`
            })
            .then(response => {
                if (response.redirected) {
                    return response.url;
                } else {
                    return response.text();
                }
            })
            .then(data => {
                if (data.includes('Invalid PIN')) {
                    alert('Invalid PIN');
                } else if (data.includes('/welcome_user')) {
                    const params = new URLSearchParams(data.split('?')[1]);
                    const username = params.get('username');
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    window.location.href = data;
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    const logoutForm = document.querySelector('form[action="/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');

    if (isLoggedIn === 'true' && username) {
        if (window.location.pathname === '/' || window.location.pathname === '/auth/login' || window.location.pathname === '/auth/register') {
            window.location.href = '/chat/index';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const inputs = document.querySelectorAll('.pin-inputs input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            if (input.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
            if (Array.from(inputs).every(input => input.value.length === 1)) {
                form.submit();
            }
        });
    });
});
