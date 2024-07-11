document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    const addMessage = (content, type) => {
        const messageElem = document.createElement('div');
        messageElem.className = `message ${type}`;
        messageElem.innerHTML = `<p>${content}</p>`;
        chatBox.appendChild(messageElem);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const fetchAIResponse = async (message) => {
        try {
            const response = await fetch('/chat/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            if (data.message) {
                addMessage(data.message, 'received');
            } else if (data.error) {
                addMessage('Error: ' + data.error, 'received');
            }
        } catch (error) {
            addMessage('Error: ' + error.message, 'received');
        }
    };

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, 'sent');
            userInput.value = '';
            fetchAIResponse(message);
        }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Trigger an initial motivational message
    fetchAIResponse('motivational quote');
});