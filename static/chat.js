document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const nextButton = document.createElement("button");
  nextButton.id = "next-button";
  nextButton.textContent = "Next";
  nextButton.style.display = "none";
  document.querySelector(".message-input-container").appendChild(nextButton);
  const openMenuButton = document.createElement("button");
  openMenuButton.id = "open-menu-button";
  openMenuButton.textContent = "Otvoriť menu";
  openMenuButton.style.display = "none";
  document.querySelector(".message-input-container").appendChild(openMenuButton);
  const steps = [
    { type: "welcome", content: `Vitaj späť, ${username}! Klikni "Ďalej" pre tvoj motivačný impulz na dnešok:` },
    { type: "api", content: "Motivácia dňa v slovenčine" },
    { type: "image", content: '<img src="/static/images/team_photo.jpg" alt="Team Photo">' },
    { type: "level", content: `Tvoj level: ${userLevel}, XP do ďalšieho levlu: 100.` },
    { type: "api_story", content: "Generate sales story" },
    { type: "final", content: "Čo by si chcel dnes robiť?" },
  ];
  const MESSAGE_STORAGE_KEY = 'chatMessages';
  let currentStep = 0;
  let startDayButtonDisplayed = false;
  let loadingMessageElem;

  const addMessage = (content, type) => {
    const messageElem = document.createElement("div");
    messageElem.className = `message ${type}`;
    messageElem.innerHTML = `<p>${content}</p>`;
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElem;
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
      const response = await fetch("/chat/get_story", { method: "POST" });
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
      "Nový report",
      "Aktívne reporty",
      "Oznámenia",
      "Naše hodnoty",
      "Osobný rozvoj",
      "Vylepšiť predaj",
      "Aký je môj level?"
    ];

    clearMessageContainer();
    const themeClass = localStorage.getItem('themeClass') || "theme-orange";

    buttonsData.forEach((btnText, index) => {
      const actionButton = document.createElement("button");
      actionButton.textContent = btnText;
      actionButton.className = `action-button ${themeClass}`;
      document.querySelector(".message-input-container").appendChild(actionButton);

      setTimeout(() => {
        actionButton.classList.add('visible');
      }, index * 100);
    });
  };

  const clearMessageContainer = () => {
    const container = document.querySelector(".message-input-container");
    container.innerHTML = "";
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
      saveMessage(step.content, "received");
      if (currentStep < steps.length) {
        showNextButton();
      } else {
        showStartDayButton();
      }
    }
  };

  const initChatFlow = () => {
    const currentDate = new Date().toISOString().split("T")[0];
    if (lastWelcomeDate === currentDate) {
      userInput.style.display = "none";
      sendButton.style.display = "none";
      addMessage(`Vítaj späť, ${username}! Klikni na "Otvoriť menu" pre pokračovanie`, "received");
      openMenuButton.style.display = "inline";
    } else {
      handleNextStep();
      fetch("/chat/update_welcome_date", { method: "POST" });
    }
  };

  openMenuButton.addEventListener("click", () => {
    displayActionButtons();
    openMenuButton.style.display = "none";
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

  initChatFlow();
  loadMessages();
});