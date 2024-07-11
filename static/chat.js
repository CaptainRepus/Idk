document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const nextButton = document.getElementById('next-button');
    const messageInputContainer = document.querySelector('.message-input-container');

    const addMessage = (content, type) => {
        const messageElem = document.createElement('div');
        messageElem.className = `message ${type}`;
        if (type === 'image') {
            const imgElem = document.createElement('img');
            imgElem.src = content;
            messageElem.appendChild(imgElem);
        } else {
            messageElem.innerHTML = `<p>${content}</p>`;
        }
        chatBox.appendChild(messageElem);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
    };

    const messages = [
        { content: "Vitaj späť, Jozef! Tu je tvoj motivačný impulz na dnešok:", type: 'received' },
        { content: "Každý predaj vás približuje k vášmu cieľu. Poďme dnes urobiť niečo významné!", type: 'received' },
        { content: "Tímová fotografia", type: 'received' },
        { content: "https://example.com/team_photo.jpg", type: 'image' },
        { content: "Generujem slávny príbeh o predaji...", type: 'sent' },
        { content: "Pozrite sa, ako sa Alexander stal legendou v oblasti predaja.", type: 'received' },
        { content: "https://example.com/story_video.jpg", type: 'image' },
        { content: "Vaša aktuálny level: 1235 🚀 Pokračujte v skvelej práci, aby ste dosiahli ďalšiu úroveň!", type: 'received' },
    ];

    let messageIndex = 0;
    nextButton.onclick = () => {
        nextButton.disabled = true;
        if (nextButton.textContent === 'Start the day') {
            nextButton.remove();
            userInput.style.display = 'block';
            sendButton.style.display = 'block';
            userInput.focus();
            addMessage("You can now start chatting!", 'received');
        } else {
            addMessage(messages[messageIndex].content, messages[messageIndex].type);
            messageIndex++;
            nextButton.disabled = false;
            if (messageIndex === messages.length) {
                nextButton.textContent = 'Start the day';
            }
        }
    };

    if (userInput && sendButton) {
        sendButton.onclick = () => {
            const message = userInput.value.trim();
            if (message) {
                addMessage(message, 'sent');
                userInput.value = '';

                // Simulate a response from server/AI
                setTimeout(() => {
                    addMessage('AI response to: ' + message, 'received');
                }, 1000);
            }
        };

        userInput.onkeypress = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendButton.click();
            }
        };
    }

    // Display the first message
    addMessage(messages[messageIndex].content, messages[messageIndex].type);
    messageIndex++;
});
