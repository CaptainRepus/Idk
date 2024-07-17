document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');
    const themeBoxes = document.querySelectorAll('.theme-box');

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
                    alert('Nesprávny PIN');
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

    // Apply theme to homepage buttons
    const applyThemeToButtons = (theme) => {
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.className = 'action-button'; // Reset class to default
            button.classList.add(`theme-${theme}`);
        });
    };

    // Update the applyTheme function
    const applyTheme = (theme) => {
        document.body.className = ''; // Clear all classes
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);
        applyThemeToButtons(theme);  // Apply theme to homepage buttons
    };

    // Initialize dark mode based on localStorage value
    const toggle = document.getElementById('dark-mode-toggle');

    if (toggle) {
        toggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', toggle.checked);
            localStorage.setItem('dark-mode', toggle.checked);
        });

        if (localStorage.getItem('dark-mode') === 'true') {
            document.body.classList.add('dark-mode');
            toggle.checked = true;
        }
    }

    // Initialize theme based on localStorage value
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // Add event listeners to theme boxes
    themeBoxes.forEach(box => {
        box.addEventListener('click', () => {
            applyTheme(box.id);
        });
    });

    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = "/chat/index";
        });
    }
});