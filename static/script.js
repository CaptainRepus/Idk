document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');
    const themeBoxes = document.querySelectorAll('.theme-box');
    const loginForm = document.getElementById('login-form');
    const pinInputs = document.querySelectorAll(".pin-input");

    // Other existing code

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

        const themeClass = `theme-${theme}`;
        localStorage.setItem('themeClass', themeClass);

        // Update action buttons theme
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.className = 'action-button'; // Reset class to default
            button.classList.add(themeClass);
        });

        // Set theme class to localStorage
        localStorage.setItem('themeClass', themeClass);

        // Set custom CSS properties for icon colors based on theme
        const root = document.documentElement;
        switch (theme) {
            case 'theme-blue':
                root.style.setProperty('--user-bg-color', '#007bff');
                root.style.setProperty('--ai-color', '#03a9f4');
                break;
            case 'theme-green':
                root.style.setProperty('--user-bg-color', '#4caf50');
                root.style.setProperty('--ai-color', '#388e3c');
                break;
            case 'theme-red':
                root.style.setProperty('--user-bg-color', '#f44336');
                root.style.setProperty('--ai-color', '#d32f2f');
                break;
            case 'theme-purple':
                root.style.setProperty('--user-bg-color', '#9c27b0');
                root.style.setProperty('--ai-color', '#7b1fa2');
                break;
            case 'theme-orange':
                root.style.setProperty('--user-bg-color', '#ff9800');
                root.style.setProperty('--ai-color', '#f57c00');
                break;
            default:
                root.style.setProperty('--user-bg-color', '#f44336');
                root.style.setProperty('--ai-color', '#d32f2f');
                break;
        }
    };

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

});  // <-- Make sure this is the closing tag for the DOMContentLoaded handler