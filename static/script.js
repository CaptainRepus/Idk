document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');
    const themeBoxes = document.querySelectorAll('.theme-box');
    const loginForm = document.getElementById('login-form');
    const pinInputs = document.querySelectorAll(".pin-input");

    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

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

    if (localStorage.getItem('isLoggedIn') === 'true') {
        const username = localStorage.getItem('username');
        if (username && (window.location.pathname === '/login' || window.location.pathname === '/')) {
            window.location.href = `/welcome_user?username=${username}`;
        }
    }

    if (loginForm) {
        pinInputs.forEach((input, index) => {
            input.addEventListener("input", (e) => {
                const nextInput = pinInputs[index + 1];
                const prevInput = pinInputs[index - 1];
                if (input.value.length > 0) {
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        // Check if all inputs are filled
                        const allFilled = Array.from(pinInputs).every(input => input.value.length > 0);
                        if (allFilled) {
                            // Automatically login when the last input is filled
                            loginForm.requestSubmit();
                        }
                    }
                } else if (e.inputType === 'deleteContentBackward' && prevInput) {
                    prevInput.focus();
                }
            });
        });
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const pin = Array.from(pinInputs).map(input => input.value).join('');
            fetch('{{ url_for("auth.auth_login") }}', {
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
                if (data.includes('Nesprávny PIN')) {
                    alert('Nesprávny PIN');
                } else if (data.includes('/chat/index')) {
                    window.location.href = data;
                }
            })
            .catch(error => console.error('Error:', error));
        });

    const logoutForm = document.querySelector('form[action="/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
        });
    }

    const applyTheme = (theme) => {
        document.body.className = '';
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);

        // Update action buttons theme
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.className = 'action-button'; // Reset class to default
            button.classList.add(`theme-${theme}`);
        });

        // Set theme class to localStorage
        localStorage.setItem('themeClass', `theme-${theme}`);

        // Set custom CSS properties for icon colors based on theme
        const root = document.documentElement;
        switch (theme) {
            case 'theme-blue':
                root.style.setProperty('--user-color', '#007bff');
                root.style.setProperty('--ai-color', '#03a9f4');
                break;
            case 'theme-green':
                root.style.setProperty('--user-color', '#4caf50');
                root.style.setProperty('--ai-color', '#388e3c');
                break;
            case 'theme-red':
                root.style.setProperty('--user-color', '#f44336');
                root.style.setProperty('--ai-color', '#d32f2f');
                break;
            case 'theme-purple':
                root.style.setProperty('--user-color', '#9c27b0');
                root.style.setProperty('--ai-color', '#7b1fa2');
                break;
            default:
                root.style.setProperty('--user-color', '#ff9800');
                root.style.setProperty('--ai-color', '#f57c00');
                break;
        }
    };

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

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

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