document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const nextButton = document.createElement('button'); // Create the Next button

    nextButton.id = 'next-button';
    nextButton.textContent = 'Next';
    nextButton.style.display = 'none'; // Initially hidden

    document.querySelector('.message-input-container').appendChild(nextButton);

    const steps = [
        { type: 'welcome', content: `Welcome, ${username}! Click "Next" to continue.` },
        { type: 'api', content: 'Motivational quote' },
        { type: 'image', content: '<img src="/static/images/team_photo.jpg" alt="Team Photo">' },
        { type: 'level', content: `Your current level: ${userLevel}, XP to next level: 100.` },
        { type: 'api_story', content: 'Generate sales story' },
        { type: 'final', content: 'Are you ready to conquer the day?' }
    ];

    let currentStep = 0;
    let startDayButtonDisplayed = false; // Flag to track if 'Start the Day' button has been displayed

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
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            if (data.message) {
                addMessage(data.message, 'received');
                if (currentStep < steps.length - 1) showNextButton(); // Show Next button until the last step
                else showStartDayButton(); // Show Start Day button at the last step
            } else if (data.error) {
                addMessage('Error: ' + data.error, 'received');
                showNextButton();
            }
        } catch (error) {
            addMessage('Error: ' + error.message, 'received');
            showNextButton();
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

    const showStartDayButton = () => {
        // Check if the Start Day button has already been displayed
        if (!startDayButtonDisplayed) {
            startDayButtonDisplayed = true; // Mark flag as true
            nextButton.style.display = 'none';
            const startDayButton = document.createElement('button');
            startDayButton.id = 'start-day-button';
            startDayButton.textContent = 'Start the Day';
            document.querySelector('.message-input-container').appendChild(startDayButton);
            startDayButton.addEventListener('click', () => {
                showUserInput();
                startDayButton.remove(); // Remove Start the Day button
            });
        }
    };

    const showUserInput = () => {
        userInput.style.display = 'inline';
        sendButton.style.display = 'inline';
        addMessage('You can now start chatting', 'received');
    };

    const handleNextStep = () => {
        const step = steps[currentStep];
        currentStep += 1;

        if (step.type === 'api') {
            fetchAIResponse(step.content);
        } else if (step.type === 'api_story') {
            fetchStory();
        } else {
            addMessage(step.content, 'received');
            if (currentStep < steps.length) {
                showNextButton();
            } else {
                showStartDayButton();
            }
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