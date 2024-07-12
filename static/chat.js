document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const nextButton = document.getElementById('next-button');
    const startDayButton = document.createElement('button'); // Create the Start the Day button

    startDayButton.id = 'start-day-button';
    startDayButton.textContent = 'Start the day';
    startDayButton.style.display = 'none'; // Initially hidden

    document.querySelector('.message-input-container').appendChild(startDayButton);

    const steps = [
        { type: 'welcome', content: `Welcome, {{ session['username'] }}! Click "Next" to continue.` },
        { type: 'api', content: 'Motivational quote' },
        { type: 'image', content: '/static/images/team_photo.jpg' },
        { type: 'level', content: `Your current level: {{ session['level'] }}, XP to next level: {{ 1000 - (session['report_count'] % 1000) }}. Click "Next" to continue.` },
        { type: 'api_story', content: 'Generate sales story' },
        { type: 'final', content: 'Are you ready to conquer the day?' }
    ];

    let currentStep = 0;

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
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

    const fetchStory = async () => {
        try {
            const response = await fetch('/chat/get_story', { method: 'POST' });
            const data = await response.json();
            if (data.story) {
                addMessage(data.story, 'received');
                showNextButton();
            } else if (data.error) {
                addMessage('Error: ' + data.error, 'received');
                showNextButton();
            }
        } catch (error) {
            addMessage('Error: ' + error.message, 'received');
            showNextButton();
        }
    };

    const showNextButton = () => {
        userInput.style.display = 'none';
        sendButton.style.display = 'none';
        nextButton.style.display = 'inline';
    };

    const showUserInput = () => {
        userInput.style.display = 'inline';
        sendButton.style.display = 'inline';
        nextButton.style.display = 'none';
        startDayButton.style.display = 'none';
    };

    const handleNextStep = () => {
        const step = steps[currentStep];
        currentStep += 1;

        if (step.type === 'api') {
            fetchAIResponse(step.content);
        } else if (step.type === 'api_story') {
            fetchStory();
        } else if (step.type === 'image') {
            addMessage(`<img src="${step.content}" alt="Team Photo">`, 'image');
            showNextButton();
        } else if (step.type === 'final') {
            addMessage(step.content, 'received');
            nextButton.style.display = 'none';
            startDayButton.style.display = 'inline';
            startDayButton.onclick = () => {
                addMessage('You can now start chatting', 'received');
                showUserInput();
            };
        } else {
            addMessage(step.content, 'received');
            showNextButton();
        }
    };

    nextButton.addEventListener('click', () => {
        handleNextStep();
    });

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

    // Trigger the initial welcome message
    handleNextStep();
});
