document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const nextButton = document.createElement("button"); // Create the Next button

  nextButton.id = "next-button";
  nextButton.textContent = "Next";
  nextButton.style.display = "none"; // Initially hidden

  document.querySelector(".message-input-container").appendChild(nextButton);

  const steps = [
    {
      type: "welcome",
      content: `Welcome, ${username}! Click "Next" to continue.`,
    },
    { type: "api", content: "Motivational quote" },
    {
      type: "image",
      content: '<img src="/static/images/team_photo.jpg" alt="Team Photo">',
    },
    { type: "level", content: `Your level: ${userLevel}, XP to next level: 100.` },
    { type: "api_story", content: "Generate sales story" },
    { type: "final", content: "Are you ready to conquer the day?" },
  ];

  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format

  let currentStep = 0;
  let startDayButtonDisplayed = false; // Flag to track if the 'Start the Day' button has been displayed
  let loadingMessageElem; // Variable to hold the loading message element

  const addMessage = (content, type) => {
    const messageElem = document.createElement("div");
    messageElem.className = `message ${type}`;
    messageElem.innerHTML = `<p>${content}</p>`;
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElem; // Return the created message element
  };

  const showLoadingMessage = () => {
    loadingMessageElem = addMessage("AI generating motivation/story...", "loading");
  };

  const hideLoadingMessage = () => {
    if (loadingMessageElem) {
      chatBox.removeChild(loadingMessageElem);
      loadingMessageElem = null;
    }
  };

  const fetchAIResponse = async (message) => {
    showLoadingMessage();
    try {
      const response = await fetch("/chat/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      hideLoadingMessage();
      if (data.message) {
        addMessage(data.message, "received");
        if (currentStep < steps.length - 1) showNextButton(); // Show Next button until the last step
        else showStartDayButton(); // Show Start Day button at the last step
      } else if (data.error) {
        addMessage("Error: " + data.error, "received");
        showNextButton();
      }
    } catch (error) {
      hideLoadingMessage();
      addMessage("Error: " + error.message, "received");
      showNextButton();
    }
  };

  const fetchStory = async () => {
    showLoadingMessage();
    try {
      const response = await fetch("/chat/get_story", { method: "POST" });
      const data = await response.json();
      hideLoadingMessage();
      if (data.story) {
        addMessage(data.story, "received");
        showNextButton();
      } else if (data.error) {
        addMessage("Error: " + data.error, "received");
        showNextButton();
      }
    } catch (error) {
      hideLoadingMessage();
      addMessage("Error: " + error.message, "received");
      showNextButton();
    }
  };

  const showNextButton = () => {
    userInput.style.display = "none";
    sendButton.style.display = "none";
    nextButton.style.display = "inline";
  };

  const showStartDayButton = () => {
    // Check if the Start Day button has already been displayed
    if (!startDayButtonDisplayed) {
      startDayButtonDisplayed = true; // Mark flag as true
      nextButton.style.display = "none";
      const startDayButton = document.createElement("button");
      startDayButton.id = "start-day-button";
      startDayButton.textContent = "Start the Day";
      document.querySelector(".message-input-container").appendChild(startDayButton);
      startDayButton.addEventListener("click", () => {
        displayActionButtons();
        startDayButton.remove(); // Remove Start the Day button
      });
    }
  };

  const displayActionButtons = () => {
    const buttonsData = [
      { text: "New report", color: "#FF6666" },
      { text: "Active reports", color: "#FF3333" },
      { text: "Notifications", color: "#FF0000" },
      { text: "Values", color: "#CC0000" },
      { text: "Personal growth", color: "#990000" },
      { text: "Help us improve", color: "#660000" },
    ];

    clearMessageContainer(); // Clear existing buttons

    buttonsData.forEach((btnData) => {
      const actionButton = document.createElement("button");
      actionButton.textContent = btnData.text;
      actionButton.style.backgroundColor = btnData.color;
      actionButton.className = "action-button"; // Add a class for consistent styling

      document.querySelector(".message-input-container").appendChild(actionButton);

      actionButton.addEventListener("click", () => {
        if (btnData.text === "New report") {
          // Show new buttons for "New customer" and "Old customer"
          displayNewCustomerOptions();
        } else {
          // Placeholder for future routing or actions
          alert(`Action for ${btnData.text} button`);
        }
      });
    });
  };

  const displayNewCustomerOptions = () => {
    const newCustomerOptions = [
      { text: "New customer", color: "#FF6666" },
      { text: "Old customer", color: "#FF3333" },
    ];

    clearMessageContainer(); // Clear existing buttons

    newCustomerOptions.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.textContent = option.text;
      optionButton.style.backgroundColor = option.color;
      optionButton.className = "action-button"; // Add a class for consistent styling

      document.querySelector(".message-input-container").appendChild(optionButton);

      optionButton.addEventListener("click", () => {
        // Placeholder for future routing or actions
        alert(`Action for ${option.text} button`);
      });
    });
  };

  const clearMessageContainer = () => {
    const container = document.querySelector(".message-input-container");
    container.innerHTML = ""; // Clear all existing content
  };

  const handleNextStep = () => {
    const step = steps[currentStep];
    currentStep += 1;

    if (step.type === "api") {
      fetchAIResponse(step.content);
    } else if (step.type === "api_story") {
      fetchStory();
    } else {
      addMessage(step.content, "received");
      if (currentStep < steps.length) {
        showNextButton();
      } else {
        showStartDayButton();
      }
    }
  };

  const initChatFlow = () => {
    if (lastWelcomeDate === currentDate) {
      // If the welcome messages were shown today, show the welcome back message and action buttons
      addMessage(`Welcome back, ${username}!`, "received");
      showStartDayButton();
    } else {
      // If the welcome messages were not shown today, proceed with the steps
      handleNextStep();
      // Update the last welcome date on the server
      fetch("/chat/update_welcome_date", { method: "POST" });
    }
  };

  nextButton.addEventListener("click", () => {
    handleNextStep();
  });

  sendButton.addEventListener("click", () => {
    const message = userInput.value.trim();
    if (message) {
      addMessage(message, "sent");
      userInput.value = "";
      fetchAIResponse(message);
    }
  });

  userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendButton.click();
    }
  });

  // Initialize the chat flow based on the last welcome date
  initChatFlow();
});