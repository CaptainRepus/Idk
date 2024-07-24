document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  // Initialize nextButton
  let nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.id = "next-button";
  nextButton.style.display = "none";
  document.querySelector(".message-input-container").appendChild(nextButton);

  // To keep track of added messages and avoid duplication
  const addedMessages = new Set();

  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsButton = document.getElementById("close-settings-button");
  const dropdownButton = document.getElementById("dropdown-button");
  const steps = [
    { type: "welcome", content: `Vitaj späť, ${username}! Klikni "Ďalej" pre tvoj motivačný impulz na dnešok:` },
    { type: "api", content: "Motivácia dňa v slovenčine" },
    { type: "image", content: `<img src="/static/images/team_photo.jpg" alt="Team Photo">` },
    { type: "level", content: `Tvoj level: ${userLevel}, XP do ďalšieho levlu: 100.` },
    { type: "api_story", content: "Generate sales story" },
    { type: "final", content: "Čo by si chcel dnes robiť?" },
  ];
  const MESSAGE_STORAGE_KEY = 'chatMessages';
  let currentStep = 0;
  let startDayButtonDisplayed = false;
  let loadingMessageElem;

  const addMessage = (content, type) => {
      if (!addedMessages.has(content)) {
        const messageElem = document.createElement("div");
        const iconElem = document.createElement("div");
        const iconContent = type === 'received' ? '<i class="fa-solid fa-brain-circuit"></i>' : '<i class="fa-solid fa-user"></i>';

        iconElem.className = `icon ${type}`;
        iconElem.innerHTML = iconContent;

        messageElem.className = `message-container ${type}`;
        messageElem.innerHTML = `
          <div class="message ${type}">
            <p>${content}</p>
          </div>
        `;

        if(type === 'received'){
          messageElem.insertBefore(iconElem, messageElem.firstChild);
        }
        else{
          messageElem.appendChild(iconElem);
        }

        chatBox.appendChild(messageElem);
        chatBox.scrollTop = chatBox.scrollHeight;
        addedMessages.add(content); // Mark this message as added
        return messageElem;
      }
      return null;
  };

  const addWelcomeBackMessage = (username) => {
    const welcomeMessage = `Vítaj späť, ${username}! Pre pokračovanie zaklikni "Otvoriť menu".`;
    addMessage(welcomeMessage, "received");
    saveMessage(welcomeMessage, "received");
  };

  function saveMessage(content, type) {
    const message = {
      text: content,
      time: new Date().toISOString(),
      type: type
    };
    const messages = getMessagesFromStorage();
    messages.push(message);
    localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messages));
  }

  function getMessagesFromStorage() {
    const messages = localStorage.getItem(MESSAGE_STORAGE_KEY);
    return messages ? JSON.parse(messages) : [];
  }

  function cleanOldMessages() {
    const messages = getMessagesFromStorage();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const updatedMessages = messages.filter(msg => new Date(msg.time) > oneDayAgo);
    localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(updatedMessages));
  }

  function loadMessages() {
    cleanOldMessages();
    const messages = getMessagesFromStorage();
    messages.forEach(msg => {
      addMessage(msg.text, msg.type);
    });
  }

  const showLoadingMessage = () => {
    loadingMessageElem = addMessage("AI generuje...", "loading");
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message
        }),
      });
      const data = await response.json();
      hideLoadingMessage();
      if (data.message) {
        addMessage(data.message, "received");
        saveMessage(data.message, "received");
        if (currentStep < steps.length - 1) showNextButton();
        else showStartDayButton();
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
      const response = await fetch("/chat/get_story", {
        method: "POST"
      });
      const data = await response.json();
      hideLoadingMessage();
      if (data.story) {
        addMessage(data.story, "received");
        saveMessage(data.story, "received");
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
    if (!startDayButtonDisplayed) {
      startDayButtonDisplayed = true;
      nextButton.style.display = "none";
      const startDayButton = document.createElement("button");
      startDayButton.id = "start-day-button";
      startDayButton.textContent = "Začať deň";
      document.querySelector(".message-input-container").appendChild(startDayButton);
      startDayButton.addEventListener("click", () => {
        const finalMessage = "Si pripravený začať deň?";
        addMessage(finalMessage, "received");
        displayActionButtons();
        startDayButton.remove();
      });
    }
  };

  const displayActionButtons = () => {
    const buttonsData = [
      { text: "Nový report" },
      { text: "Aktívne reporty" },
      { text: "Oznámenia" },
      { text: "Naše hodnoty" },
      { text: "Osobný rozvoj" },
      { text: "Aký je môj level?" },
    ];

    clearMessageContainer();
    const themeClass = localStorage.getItem('themeClass') || "theme-orange";

    buttonsData.forEach((btn, index) => {
      const actionButton = document.createElement("button");
      actionButton.textContent = btn.text;
      actionButton.className = `action-button ${themeClass}`;
      document.querySelector(".message-input-container").appendChild(actionButton);

      // Add event listener to load the module dynamically
      actionButton.addEventListener('click', async () => {
        if (btn.text === "Nový report") {
          handleNewReportAction(chatBox);
        } else {
          console.error(`Handler for ${btn.text} not implemented`);
        }
      });

      setTimeout(() => {
        actionButton.classList.add('visible');
      }, index * 100);
    });
  };

  const hideAllActionButtons = () => {
    document.querySelectorAll(".action-button").forEach(button => {
      button.remove();
    });
  };

  const clearMessageContainer = () => {
    const container = document.querySelector(".message-input-container");
    container.innerHTML = "";
  };

  const handleNextStep = () => {
    const step = steps[currentStep];
    if (step && currentStep < steps.length) {
      currentStep += 1;
      if (step.type === "api") {
        fetchAIResponse(step.content);
      } else if (step.type === "api_story") {
        fetchStory();
      } else {
        addMessage(step.content, "received");
        saveMessage(step.content, "received");
        if (currentStep < steps.length) {
          showNextButton();
        } else {
          showStartDayButton();
        }
      }
    }
  };

  const initChatFlow = () => {
    const currentDate = new Date().toISOString().split("T")[0];
    if (lastWelcomeDate === currentDate) {
      userInput.style.display = "none";
      sendButton.style.display = "none";
      const openMenuButton = document.getElementById("open-menu-button");
      if (openMenuButton) {
        openMenuButton.style.display = "inline";
        openMenuButton.addEventListener("click", () => {
          displayActionButtons();
          openMenuButton.style.display = "none";
        });
      }
      addMessage(`Vítaj späť, ${username}! Klikni na "Otvoriť menu" pre pokračovanie`, "received");
    } else {
      handleNextStep();
      fetch("/chat/update_welcome_date", {
        method: "POST"
      });
    }
  };

  dropdownButton.addEventListener('click', () => {
    settingsModal.style.display = 'block';
  });

  closeSettingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  nextButton.addEventListener("click", () => {
    handleNextStep();
  });

  sendButton.addEventListener("click", () => {
    const message = userInput.value.trim();
    if (message) {
      addMessage(message, "sent");
      saveMessage(message, "sent");
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

  loadMessages();
  addWelcomeBackMessage(username);
  initChatFlow();
  const showClientTypeButtons = () => {
    const messageContainer = document.querySelector(".message-input-container");

    // Clear existing action buttons
    messageContainer.innerHTML = "";

    // Helper function to add animation
    const animateButton = (button, delay) => {
      setTimeout(() => {
        button.classList.add('visible');
      }, delay);
    };

    // Create "Nový zákazník" button
    const newClientButton = document.createElement("button");
    newClientButton.textContent = "Nový zákazník";
    newClientButton.className = "action-button new-report-button"; // Added specific class
    newClientButton.addEventListener('click', () => {
      addMessage("Chcem pridať nového zákazníka", "sent");
      askForCustomerName();  // New function call added here
    });
    messageContainer.appendChild(newClientButton);
    animateButton(newClientButton, 100); // Animate after 100ms

    // Create "Existujúci zákazník" button
    const existingClientButton = document.createElement("button");
    existingClientButton.textContent = "Existujúci zákazník";
    existingClientButton.className = "action-button new-report-button"; // Added specific class
    existingClientButton.addEventListener('click', () => {
      addMessage("Selected Existujúci zákazník", "sent");
    });
    messageContainer.appendChild(existingClientButton);
    animateButton(existingClientButton, 200); // Animate after 200ms
  };

  // Add createButton function at the top
  function createButton(text, callback, className = 'car-brand-button') {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', callback);
    return button;
  }

  const askForCustomerName = () => {
    const messageContainer = document.querySelector(".message-input-container");
    // Clear existing content
    messageContainer.innerHTML = "";
    // Ask for customer name
    addMessage("Ako sa volá nový zákazník?", "received");
    // Create text input for customer name
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Zadajte meno zákazníka";
    nameInput.className = "customer-name-input";
    messageContainer.appendChild(nameInput);
    // Create submit button for customer name
    const submitButton = createButton('Odoslať', () => {
      const customerName = nameInput.value.trim();
      if (customerName) {
        addMessage(`Nový zákazník: ${customerName}`, "sent");
        askForMeetingType(); // Call the function to handle meeting type selection
      }
    }, 'submit-button');
    messageContainer.appendChild(submitButton);
  };
  const askForMeetingType = () => {
    const messageContainer = document.querySelector(".message-input-container");
    // Clear existing content
    messageContainer.innerHTML = "";
    // Ask for meeting type
    addMessage("O aký druh strenutia sa jednalo?", "received");
    // Define meeting types
    const meetingTypes = ["Meeting", "Test Drive", "Order", "Vehicle Handover"];
    // Create meeting type buttons
    meetingTypes.forEach(meetingType => {
      const button = createButton(meetingType, () => {
        addMessage(`Selected meeting type: ${meetingType}`, "sent");
        handleMeetingTypeSelection(meetingType); // Handle the specific meeting type
      }, "meeting-type-button");
      messageContainer.appendChild(button);
    });
  };
  const handleMeetingTypeSelection = (meetingType) => {
    const messageContainer = document.querySelector(".message-input-container");
    // Clear existing content
    messageContainer.innerHTML = "";
    if (meetingType === "Meeting") {
      addMessage("Bol meeting online alebo offline?", "received");
      const onlineButton = createButton("Online meeting", () => {
        addMessage("Online meeting selected", "sent");
        askForCarBrand();
      }, "meeting-option-button");
      const offlineButton = createButton("Offline meeting", () => {
        addMessage("Offline meeting selected", "sent");
        askForCarBrand();
      }, "meeting-option-button");
      messageContainer.appendChild(onlineButton);
      messageContainer.appendChild(offlineButton);
    } else if (meetingType === "Order") {
      addMessage("V akom obchode bolo auto objednané?", "received");
      const pkAutoButton = createButton("PK Auto", () => {
        addMessage("PK Auto selected", "sent");
        askForCarBrand();
      }, "order-option-button");
      const personalDealerButton = createButton("Osobný predajca", () => {
        addMessage("Osobný predajca selected", "sent");
        askForCarBrand();
      }, "order-option-button");
      messageContainer.appendChild(pkAutoButton);
      messageContainer.appendChild(personalDealerButton);
    } else if (meetingType === "Test Drive") {
      askForCarBrand();
    } else if (meetingType === "Vehicle Handover") {
      // For now, do nothing
      askForCarBrand();
    }
  };
  const askForCarBrand = () => {
    const messageContainer = document.querySelector(".message-input-container");
    // Clear existing content
    messageContainer.innerHTML = "";
    // Ask for car brand
    addMessage("Zaznačte, o ktorú značku auta mal klient záujem", "received");
    // Create car brand buttons with corresponding model selection
    const brands = [
      { brand: "Nissan", models: ["model7", "model8", "model9"] },
      { brand: "Opel", models: ["model4", "model5", "model6"] },
      { brand: "Toyota", models: ["model1", "model2", "model3"] }
    ];
    brands.forEach(({ brand, models }) => {
      const button = createButton(brand, () => {
        addMessage(`Klient má záujem o ${brand}`, "sent");
        displayCarModels(brand, models);
      });
      messageContainer.appendChild(button);
    });
  };
  const displayCarModels = (brand, models) => {
    const messageContainer = document.querySelector(".message-input-container");
    // Clear existing content
    messageContainer.innerHTML = "";
    // Ask to select a car model
    addMessage("Teraz vyberte model auta", "received");
    // Create car model buttons
    models.forEach((model) => {
      const button = createButton(model, () => {
        addMessage(`Vybraný model: ${model}`, "sent");
        // Further processing can be handled here if needed
      }, "car-model-button");
      messageContainer.appendChild(button);
    });
  };
  // CSS to ensure proper styling
  const style = document.createElement('style');
  style.innerHTML = `
    .car-brand-button,
    .car-model-button,
    .submit-button,
    .meeting-type-button,
    .meeting-option-button,
    .order-option-button {
      width: 100%; /* Full width */
      padding: 12px 20px;
      margin: 8px 0;
      background-color: #4CAF50; /* Green */
      color: white;
      border: none;
      cursor: pointer;
      font-size: 16px; /* Increase font size */
    }
    .car-brand-button:hover,
    .car-model-button:hover,
    .submit-button:hover,
    .meeting-type-button:hover,
    .meeting-option-button:hover,
    .order-option-button:hover {
      background-color: #45a049;
    }
    /* Ensure the message-input-container does not overlap with the chat-box */
    .message-input-container {
      position: relative; /* Positioned relative*/
      z-index: 10; /* Bring it above other elements */
      background: white; /* Background color to distinguish */
    }
    .chat-messages {
      padding-bottom: 80px; /* To make space for input elements */
    }
  `;
  document.head.appendChild(style);

  // CSS to ensure proper styling
  style.innerHTML = `
  .car-brand-button,
  .car-model-button,
  .submit-button {
    width: 100%; /* Full width */
    padding: 12px 20px;
    margin: 8px 0;
    background-color: #4CAF50; /* Green */
    color: white;
    border: none;
    cursor: pointer;
    font-size: 16px; /* Increase font size */
  }

  .car-brand-button:hover,
  .car-model-button:hover,
  .submit-button:hover {
    background-color: #45a049;
  }

  /* Ensure the message-input-container does not overlap with the chat-box */
  .message-input-container {
    position: relative; /* Positioned relative*/
    z-index: 10; /* Bring it above other elements */
    background: white; /* Background color to distinguish */
  }

  .chat-messages {
    padding-bottom: 80px; /* To make space for input elements */
  }
  `;
  document.head.appendChild(style);


  // CSS to ensure proper styling
  style.innerHTML = `
  .car-brand-button {
    width: 100%; /* Full width */
    padding: 12px 20px;
    margin: 8px 0;
    background-color: #4CAF50; /* Green */
    color: white;
    border: none;
    cursor: pointer;
    font-size: 16px; /* Increase font size */
  }

  .car-brand-button:hover {
    background-color: #ff8080;
  }
  `;
  document.head.appendChild(style);

  const handleNewReportAction = (chatBox) => {
    const messageContainer = document.querySelector(".message-input-container");

    const addMessage = (content, type) => {
      const messageElem = document.createElement("div");
      const iconElem = document.createElement("div");
      iconElem.className = `icon ${type}`;
      iconElem.innerHTML = type === 'received' ? '<i class="fa-solid fa-brain-circuit"></i>' : '<i class="fa-solid fa-user"></i>';

      messageElem.className = `message-container ${type}`;

      const messageContent = `
        <div class="message ${type}">
          <p>${content}</p>
        </div>
      `;

      if (type === 'received') {
        messageElem.innerHTML = `${iconElem.outerHTML} ${messageContent}`;
      } else {
        messageElem.innerHTML = `${messageContent} ${iconElem.outerHTML}`;
      }

      chatBox.appendChild(messageElem);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    addMessage("Chcem pridať nový report", "sent");
    setTimeout(() => {
      addMessage("Skvelé! Poďme začať s vaším novým reportom. Chcete pridať report pre nového klienta alebo existujúceho klienta?", "received");

      // Display new buttons
      showClientTypeButtons();
    }, 500);
  };
});