document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  let reportData = {};

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

          // Apply current theme class to the message container
          const themeClass = localStorage.getItem('themeClass') || "theme-orange";
          messageElem.classList.add(themeClass);

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
    const loadingMessageElem = addMessage('<span>AI generuje odpoveď<span class="loading-dots"></span></span>', "received"); // Make it look like a received message
    const themeClass = localStorage.getItem('themeClass') || "theme-orange";
    loadingMessageElem.classList.add(themeClass);
    loadingMessageElem.classList.add('loading');

    return loadingMessageElem;
  };

  const hideLoadingMessage = (loadingMessageElem) => {
    if (loadingMessageElem) {
      chatBox.removeChild(loadingMessageElem);
    }
  };

  const fetchAIResponse = async (message) => {
    const loadingMessageElem = showLoadingMessage();

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
      hideLoadingMessage(loadingMessageElem);

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
      hideLoadingMessage(loadingMessageElem);
      addMessage("Error: " + error.message, "received");
      showNextButton();
    }
  };

  const saveEndOfDayState = () => {
      localStorage.setItem('reportsSubmittedToday', new Date().toISOString().split("T")[0]);
      displayActionButtons(); // Call to update buttons immediately
  };

  const fetchStory = async () => {
    const loadingMessageElem = showLoadingMessage();

    try {
      const response = await fetch("/chat/get_story", {
        method: "POST"
      });

      const data = await response.json();
      hideLoadingMessage(loadingMessageElem);

      if (data.story) {
        addMessage(data.story, "received");
        saveMessage(data.story, "received");
        showNextButton();
      } else if (data.error) {
        addMessage("Error: " + data.error, "received");
        showNextButton();
      }
    } catch (error) {
      hideLoadingMessage(loadingMessageElem);
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

  const fetchReports = async () => {
    try {
      const response = await fetch('/chat/get_reports');
      const data = await response.json();

      if (data.reports) {
        displayReportsAsMessages(data.reports);
      } else {
        addMessage("No reports found.", "received");
      }
    } catch (error) {
      addMessage("Error fetching reports: " + error.message, "received");
    }
  };

  const displayReportsAsMessages = (reports) => {
    reports.forEach(report => {
      const reportMessage = `
        <strong>Author:</strong> ${report.author}<br>
        <strong>Name:</strong> ${report.customerName}<br>
        <strong>Meeting Type:</strong> ${report.meetingType}<br>
        ${report.meetingDetail ? `<strong>Detail:</strong> ${report.meetingDetail}<br>` : ""}
        ${report.orderLocation ? `<strong>Order Location:</strong> ${report.orderLocation}<br>` : ""}
        ${report.financing ? `<strong>Financing:</strong> ${report.financing}<br>` : ""}
        <strong>Car Brand:</strong> ${report.carBrand}<br>
        <strong>Car Model:</strong> ${report.carModel}
      `;
      addMessage(reportMessage, "received");
    });
  };
  
  const displayActionButtons = () => {
    const currentDay = new Date().toISOString().split("T")[0];
    const reportsSubmittedToday = localStorage.getItem('reportsSubmittedToday');

    const messageContainer = document.querySelector(".message-input-container");
    messageContainer.innerHTML = ""; // Clear existing buttons

    const buttonsData = [
        { text: "Nový report" },
        { text: "Aktívne reporty" },
        { text: "Oznámenia" },
        { text: "Aké sú naše hodnoty?" },
        { text: "Osobný rozvoj" },
        { text: "Aký je môj level?" }
    ];

    const themeClass = localStorage.getItem('themeClass') || "theme-orange";

    if (reportsSubmittedToday === currentDay) {
        // User has submitted reports for the day, display "Joke of the day"
        const jokeButton = createButton("Joke of the day", () => {}, `action-button ${themeClass}`);
        messageContainer.appendChild(jokeButton);

        // Make "Joke of the day" button visible
        setTimeout(() => {
            jokeButton.classList.add('visible');
        }, 100);

        // Display other buttons except "Nový report"
        buttonsData.forEach((btn, index) => {
            if (btn.text !== "Nový report") {
                const actionButton = createButton(btn.text, () => {
                    if (btn.text === "Aktívne reporty") {
                        fetchReports();
                    } else {
                        console.error(`Handler for ${btn.text} not implemented`);
                    }
                }, `action-button ${themeClass}`);
                messageContainer.appendChild(actionButton);

                setTimeout(() => {
                    actionButton.classList.add('visible');
                }, (index + 1) * 100); // Animate buttons in order
            }
        });
    } else {
        // Display all buttons including "Nový report"
        buttonsData.forEach((btn, index) => {
            const actionButton = createButton(btn.text, () => {
                if (btn.text === "Nový report") {
                    handleNewReportAction(chatBox);
                } else if (btn.text === "Aktívne reporty") {
                    fetchReports();
                } else {
                    console.error(`Handler for ${btn.text} not implemented`);
                }
            }, `action-button ${themeClass}`);
            messageContainer.appendChild(actionButton);

            setTimeout(() => {
                actionButton.classList.add('visible');
            }, index * 100); // Animate buttons in order
        });
    }
  };

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    displayActionButtons(); // Ensure buttons are updated on page load
  });

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    displayActionButtons(); // Ensure buttons are updated on page load
  });

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    displayActionButtons(); // Ensure buttons are updated on page load
  });

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    displayActionButtons();
  });

  const hideAllActionButtons = () => {
    document.querySelectorAll(".action-button").forEach(button => {
      button.remove();
    });
  };

  const clearMessageContainer = () => {
    const messageContainer = document.querySelector(".message-input-container");
    messageContainer.innerHTML = ""; // Clear existing content
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
  // Update showClientTypeButtons to include Existing Customer handler
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
    newClientButton.className = "action-button new-report-button";
    newClientButton.addEventListener('click', () => {
      addMessage("Chcem pridať nového zákazníka", "sent");
      askForCustomerName();
    });
    messageContainer.appendChild(newClientButton);
    animateButton(newClientButton, 100); // Animate after 100ms

    // Create "Existujúci zákazník" button
    const existingClientButton = document.createElement("button");
    existingClientButton.textContent = "Existujúci zákazník";
    existingClientButton.className = "action-button new-report-button";
    existingClientButton.addEventListener('click', () => {
      addMessage("Chcem pridať existujúceho zákazníka", "sent");
      fetchExistingCustomers(); // Fetch and display existing customers
    });
    messageContainer.appendChild(existingClientButton);
    animateButton(existingClientButton, 200); // Animate after 200ms

    // Create "Aktívne reporty" button
    const activeReportsButton = document.createElement("button");
    activeReportsButton.textContent = "Aktívne reporty";
    activeReportsButton.className = "action-button report-button";
    activeReportsButton.addEventListener('click', () => {
      addMessage("Chcem vidieť aktívne reporty", "sent");
      fetchReports(); // Fetch and display active reports
    });
    messageContainer.appendChild(activeReportsButton);
    animateButton(activeReportsButton, 300); // Animate after 300ms
  };

  // Add createButton function at the top
  function createButton(text, callback, className = 'action-button') {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', () => {
      callback();
      scrollToBottom(); // Ensure scroll to bottom on new button click
    });
    return button;
  }

  // Add this function to handle smooth scrolling to the bottom
  function scrollToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.scroll({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }

  // Add this function to add event listeners to action buttons
  function addActionButtonsListeners() {
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Custom logic on button click (if any)
        scrollToBottom();
      });
    });
  }

  // Add listeners to action buttons after DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    addActionButtonsListeners();
  });

  // If you want to scroll whenever a new message is added
  document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('.chat-messages');
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });
    observer.observe(chatMessages, { childList: true });
  });

  const displayAllReports = async () => {
      try {
          const response = await fetch('/chat/get_today_reports', {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              }
          });

          if (response.ok) {
              const reports = await response.json();
              const messageContainer = document.querySelector(".message-input-container");

              // Clear existing content
              clearMessageContainer();

              // Display reports
              reports.forEach(report => {
                  const reportDiv = document.createElement('div');
                  reportDiv.classList.add('report-item');
                  reportDiv.innerText = report.content;
                  messageContainer.appendChild(reportDiv);
              });

              addMessage("Naozaj chcete odovzdať všetky reporty? Po odovzdaní už nemôžete pridať report na dnešok", "received");

              const confirmSubmitButton = createButton("Odovzdať", () => {
                  saveEndOfDayState(); // Save the state when confirmed
                  window.location.href = "/"; // Redirect to homepage
              }, "post-confirm-button");

              const cancelSubmitButton = createButton("Zrušiť", () => {
                  addMessage("Zrušiť", "sent");
                  window.location.href = "/"; // Redirect to homepage
              }, "post-confirm-button");

              messageContainer.appendChild(confirmSubmitButton);
              messageContainer.appendChild(cancelSubmitButton);
          } else {
              addMessage("Failed to fetch today's reports.", "received");
          }
      } catch (error) {
          addMessage("Error: " + error.message, "received");
      }
  };

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
        reportData.customerName = customerName;
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
        addMessage(`Bol to druh stretnutia: ${meetingType}`, "sent");
        reportData.meetingType = meetingType;
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
        addMessage("Bol to online meeting", "sent");
        reportData.meetingDetail = "Online meeting";
        askForCarBrand();
      }, "meeting-option-button");
      const offlineButton = createButton("Offline meeting", () => {
        addMessage("Bol to offline meeting", "sent");
        reportData.meetingDetail = "Offline meeting";
        askForCarBrand();
      }, "meeting-option-button");
      messageContainer.appendChild(onlineButton);
      messageContainer.appendChild(offlineButton);
    } else if (meetingType === "Order") {
      addMessage("V akom obchode bolo auto objednané?", "received");
      const presovButton = createButton("Prešov", () => {
        addMessage("Auto bolo objendané v Prešove", "sent");
        reportData.orderLocation = "Prešov";
        askForCarBrand();
      }, "order-option-button");
      const popradButton = createButton("Poprad", () => {
        addMessage("Auto bolo objendané v Poprade", "sent");
        reportData.orderLocation = "Poprad";
        askForCarBrand();
      }, "order-option-button");
      messageContainer.appendChild(presovButton);
      messageContainer.appendChild(popradButton);
    } else if (meetingType === "Test Drive") {
      addMessage("Vyberte značku a model auta pre skúšobnú jazdu.", "received");
      askForCarBrand();
    } else if (meetingType === "Vehicle Handover") {
      addMessage("Ako bolo alebo bude vozidlo financované?", "received");
      const fullAmountButton = createButton("Celá suma", () => {
        addMessage("Klient vyplatil celú sumu", "sent");
        reportData.financing = "Celá suma";
        askForCarBrand();
      }, "financing-option-button");
      const leasingButton = createButton("Leasing", () => {
        addMessage("Klient si vybral auto na leasing", "sent");
        reportData.financing = "Leasing";
        askForCarBrand();
      }, "financing-option-button");
      messageContainer.appendChild(fullAmountButton);
      messageContainer.appendChild(leasingButton);
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
        reportData.carBrand = brand;
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
        reportData.carModel = model;
        finalizeReport();
      }, "car-model-button");
      messageContainer.appendChild(button);
    });
  };
  const finalizeReport = () => {
    clearMessageContainer(); // Clear the message container

    // Create submit and cancel buttons
    const submitButton = createButton("Odovzdať", submitReport, "submit-button");
    const cancelButton = createButton("Zrušiť", () => {
      window.location.href = "/"; // Redirect to homepage
    }, "cancel-button");

    const messageContainer = document.querySelector(".message-input-container");
    messageContainer.appendChild(submitButton);
    messageContainer.appendChild(cancelButton);
  };

  const showPostSubmissionOptions = () => {
      clearMessageContainer(); // Clear the message container

      // Add the question
      addMessage("Dokončil si všetky reporty na dnes?", "received");

      // Create the first button "To sú všetky reporty na dnes"
      const allReportsDoneButton = createButton("To sú všetky reporty na dnes", () => {
          clearMessageContainer(); // Clear the message container before displaying reports
          addMessage("To sú všetky reporty na dnes", "sent");
          displayAllReports();
      }, "post-report-button");

      // Create the second button "Ešte budem pridávať"
      const addMoreReportsButton = createButton("Ešte budem pridávať", () => {
          addMessage("Ešte budem pridávať", "sent");
          window.location.href = "/"; // Redirect to homepage
      }, "post-report-button");

      const messageContainer = document.querySelector(".message-input-container");
      messageContainer.appendChild(allReportsDoneButton);
      messageContainer.appendChild(addMoreReportsButton);
  };
  
  const submitReport = async () => {
    try {
      const reportDataWithAuthor = {
        ...reportData,
        author: username // Add the user's name to the report data
      };

      const response = await fetch('/chat/submit_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportDataWithAuthor)
      });

      if (response.ok) {
        addMessage("Report successfully submitted!", "received");
        // Show the two new buttons only after the report is successfully submitted
        setTimeout(() => {
          showPostSubmissionOptions();
        }, 2000);
      } else {
        addMessage("Failed to submit report. Please try again.", "received");
      }
    } catch (error) {
      addMessage("Error: " + error.message, "received");
    }
  };

  
  const cancelReport = () => {
    window.location.reload();
  };
  // CSS to ensure proper styling
  const style = document.createElement('style');
  style.innerHTML = `
    .car-brand-button,
    .car-model-button,
    .submit-button,
    .meeting-type-button,
    .meeting-option-button,
    .order-option-button,
    .financing-option-button,
    .cancel-button {
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
    .order-option-button:hover,
    .financing-option-button:hover,
    .cancel-button:hover {
      background-color: #45a049;
    }

    .cancel-button {
      background-color: #FF0000; /* Red for cancel button */
    }

    .cancel-button:hover {
      background-color: #cc0000; /* Darker red on hover */
    }

    .report-box {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background-color: #f9f9f9;
    }

    .message-input-container {
      position: relative; /* Positioned relative */
      z-index: 10; /* Bring it above other elements */
      background: white; /* Background color to distinguish */
    }

    .chat-messages {
      padding-bottom: 80px; /* To make space for input elements */
    }
  `;
  document.head.appendChild(style);

  // Function to handle fetching existing customers
  const fetchExistingCustomers = async () => {
    try {
      const response = await fetch('/chat/get_reports');
      const data = await response.json();

      if (data.reports) {
        // Extract unique customer names from reports
        const customerNames = [...new Set(data.reports.map(report => report.customerName))];
        displayCustomerButtons(customerNames);
      } else {
        addMessage("No existing customers found.", "received");
      }
    } catch (error) {
      addMessage("Error fetching customers: " + error.message, "received");
    }
  };

  // Function to display customer buttons
  const displayCustomerButtons = (customerNames) => {
    const messageContainer = document.querySelector(".message-input-container");

    // Clear existing content
    messageContainer.innerHTML = "";

    // Helper function to add animation
    const animateButton = (button, delay) => {
      setTimeout(() => {
        button.classList.add('visible');
      }, delay);
    };

    // Create customer name buttons
    customerNames.forEach((name, index) => {
      const customerButton = document.createElement("button");
      customerButton.textContent = name;
      customerButton.className = "action-button customer-button";
      customerButton.addEventListener('click', () => {
        addMessage(`Chcem pridať report s klientom ${name}`, "sent");
        reportData.customerName = name;
        askForMeetingType();  // Proceed to next step
      });
      messageContainer.appendChild(customerButton);
      animateButton(customerButton, index * 100); // Stagger animations
    });
  };

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

  // Ensure the updated showClientTypeButtons method is used in the handleNewReportAction where necessary
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
      showClientTypeButtons();  // Show client type options
    }, 500);
  };
  
  const showNewReportOptions = () => {
    clearMessageContainer(); // Clear the message container

    // Create "new customer" and "existing customer" buttons
    const newCustomerButton = createButton("Nový zákazník", () => {
      addMessage("Nový zákazník zvolený", "sent");
    });

    const existingCustomerButton = createButton("Existujúci zákazník", () => {
      addMessage("Existujúci zákazník zvolený", "sent");
    });

    const messageContainer = document.querySelector(".message-input-container");
    messageContainer.appendChild(newCustomerButton);
    messageContainer.appendChild(existingCustomerButton);
  };
  

  const updateActionButtons = () => {
    const currentDay = new Date().toISOString().split("T")[0];
    const reportsSubmittedToday = localStorage.getItem('reportsSubmittedToday');

    if (reportsSubmittedToday === currentDay) {
        replaceNewReportButton();
    }
  };

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    updateActionButtons();
  });

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    updateActionButtons();
  });

  function replaceNewReportButton() {
    document.querySelectorAll('.new-report-button').forEach(button => {
      button.textContent = "Joke of the day";
      button.classList.add('joke-button');
      button.classList.remove('new-report-button');
      button.onclick = null; // Reset previous event listeners

      button.addEventListener('click', async () => {
        console.log('Joke button clicked'); // Debugging log
        try {
          const response = await fetch('/chat/get_funny_story', {
            method: 'POST'
          });
          const data = await response.json();
          if (data.message) {
            addMessage(data.message, "received");
            saveMessage(data.message, "received");
          } else if (data.error) {
            addMessage("Error: " + data.error, "received");
          }
        } catch (error) {
          addMessage("Error: " + error.message, "received");
        }
      });
    });
  }


  const fetchRandomMessage = async () => {
    showLoadingMessage();
    try {
      const response = await fetch('/chat/get_random_message', {
        method: 'GET'
      });
      const data = await response.json();
      hideLoadingMessage();
      if (data.message) {
        addMessage(data.message, "received");
        saveMessage(data.message, "received");
      } else if (data.error) {
        addMessage("Error: " + data.error, "received");
      }
    } catch (error) {
      hideLoadingMessage();
      addMessage("Error: " + error.message, "received");
    }
  };
});