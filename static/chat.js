document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  let reportData = {};
  const role = "{{ role }}";

  // Initialize nextButton
  let nextButton = document.createElement("button");
  nextButton.textContent = "Ďalej";
  nextButton.id = "next-button";
  nextButton.style.display = "none";
  document.querySelector(".message-input-container").appendChild(nextButton);

  //LogOut button
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        window.location.href = "/auth/login";
      } else {
        console.error("Failed to log out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  // To keep track of added messages and avoid duplication
  const addedMessages = new Set();

  const getUserLevel = async () => {
  try {
    const response = await fetch('/chat/get_user_level', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      const level = data.level || 1; // Default to 1 if level is not available
      // Update the UI with the user's level
      document.querySelector('.user-level span').textContent = `Úroveň: ${level}`;
      // Store the user level in local storage for later use
      localStorage.setItem('userLevel', level);
    } else {
      console.error("Failed to fetch user level");
    }
  } catch (error) {
    console.error("Error fetching user level:", error);
  }
};

  // Call getUserData when the page loads
  getUserLevel();

  // Re-fetch user data when the user moves to "/"
  window.addEventListener('popstate', (event) => {
    if (location.pathname === "/") {
      getUserLevel();
    }
  });

  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsButton = document.getElementById("close-settings-button");
  const dropdownButton = document.getElementById("dropdown-button");
  dropdownButton.addEventListener('click', () => {
    settingsModal.classList.add('open'); // Add the 'open' class to show the modal
  });

  closeSettingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('open'); // Remove the 'open' class to hide the modal
  });
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
      const loadingMessageElem = addMessage('<span>Načítava<span class="loading-dots"></span></span>', "received"); // Make it look like a received message
      if (loadingMessageElem) {
          const themeClass = localStorage.getItem('themeClass') || "theme-orange";
          loadingMessageElem.classList.add(themeClass);
          loadingMessageElem.classList.add('loading');
      } else {
          console.error('Loading message element could not be created');
      }
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
      const loadingMessageElem = showLoadingMessage(); // Show loading message

      try {
          const response = await fetch(`/chat/get_reports`);
          const data = await response.json();

          hideLoadingMessage(loadingMessageElem); // Hide loading message after fetching

          if (data.reports) {
              const userReports = data.reports.filter(report => report.author === username);
              displayReportsAsMessages(userReports);
          } else {
              addMessage("No reports found.", "received");
          }
      } catch (error) {
          hideLoadingMessage(loadingMessageElem); // Hide loading message if error occurs
          addMessage("Error fetching reports: " + error.message, "received");
      }
  };


  const displayReportsAsMessages = (reports) => {
      reports.forEach(report => {
          const reportMessage = `
          <strong>Meno klienta:</strong> ${report.customerName}<br>
          <strong>Typ stretnutia:</strong> ${report.meetingType}<br>
          ${report.meetingDetail ? `<strong>Detail:</strong> ${report.meetingDetail}<br>` : ""}
          ${report.orderLocation ? `<strong>Predajňa objednávky:</strong> ${report.orderLocation}<br>` : ""}
          ${report.financing ? `<strong>Financovanie:</strong> ${report.financing}<br>` : ""}
          <strong>Auto:</strong> ${report.carBrand} ${report.carModel}`;
          addMessage(reportMessage, "received");
      });
  };


  const displayCustomerButtons = (customerNames) => {
      const messageContainer = document.querySelector(".message-input-container");

      // Helper function to add animation
      const animateButton = (button, delay) => {
          setTimeout(() => {
              button.classList.add('visible');
          }, delay);
      };

      // Clear existing customer buttons without removing search input
      clearCustomerButtons();

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

  const handleSearchReports = async (query, type) => {
    const loadingMessageElem = showLoadingMessage(); // Show loading message

    try {
        const response = await fetch("/chat/get_reports");
        const data = await response.json();

        hideLoadingMessage(loadingMessageElem); // Hide loading message after fetching

        if (data.reports) {
            const filteredReports = data.reports.filter(report => {
                const hasCustomerName = report.customerName !== undefined;
                const matchesClient = query ? (hasCustomerName && report.customerName.toLowerCase().includes(query.toLowerCase())) : true;
                const matchesType = type ? report.meetingType === type : true;
                const matchesAuthor = report.author === username; // Filter by current user's name
                return matchesClient && matchesType && matchesAuthor;
            });

            if (filteredReports.length > 0) {
                displayReportsAsMessages(filteredReports);
                addMessage("Toto je tvoj výsledok vyhľadávania.", "received");
            } else {
                addMessage("Neboli nájdené žiadne reporty. Skontrolujte, či ste napísali meno klienta správne.", "received");
            }
        } else {
            addMessage("Neboli nájdené žiadne reporty", "received");
        }
    } catch (error) {
        hideLoadingMessage(loadingMessageElem); // Hide loading message if error occurs
        addMessage(`Problém s vyhľadavaním: ${error.message}`, "received");
    }
  };

  const handleSearchExistingCustomers = async (query) => {
    try {
        const response = await fetch("/chat/get_reports");
        const data = await response.json();

        if (data.reports) {
            const allCustomers = [...new Set(data.reports.map(report => report.customerName))];
            const filteredCustomers = allCustomers.filter(name => name && name.toLowerCase().includes(query.toLowerCase()));

            displayCustomerButtons(filteredCustomers);
        } else {
            addMessage("No existing customers found.", "received");
        }
    } catch (error) {
        addMessage(`Error fetching customers: ${error.message}`, "received");
    }
  };



  const handleActiveReports = () => {
      clearMessageContainer();
      addMessage("Predtým ako budeš vidieť svoje aktívne reporty, tak vyhľadaj aké chceš vidieť.(Prázdné políčko ukáže všetky reporty)", "received");

      const messageContainer = document.querySelector(".message-input-container");

      // Create search input
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "Vyhľadať meno klienta...";
      searchInput.classList.add("search-input");

      // Create type selector
      const typeSelect = document.createElement("select");
      const meetingTypes = ["", "Meeting", "Test Drive", "Order", "Vehicle Handover"];
      meetingTypes.forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          option.text = type ? type : "Vybrať typ stretnutia";
          typeSelect.appendChild(option);
      });
      typeSelect.classList.add("type-select");

      // Create search button
      const searchButton = createButton("Vyhľadávať", () => {
          const query = searchInput.value.trim();
          const type = typeSelect.value.trim();
          handleSearchReports(query, type);
      });
      searchButton.classList.add('visible');

      // Create the cancel button
      const cancelButton = createButton("Zrušiť", () => {
          window.location.href = "/"; // Redirect to the root route
      }, "action-button cancel-button visible");

      // Append all elements to the message container
      messageContainer.appendChild(searchInput);
      messageContainer.appendChild(typeSelect);
      messageContainer.appendChild(searchButton);
      messageContainer.appendChild(cancelButton);
  };

  const handleAddNotification = () => {
    addMessage("Pridať oznámenie handling is not implemented yet.", "received");
};

const handleManageValues = () => {
    addMessage("Spravovať hodnoty handling is not implemented yet.", "received");
};
  
  const displayActionButtons = () => {
      const currentDay = new Date().toISOString().split("T")[0];
      const reportsSubmittedToday = localStorage.getItem('reportsSubmittedToday');

      const messageContainer = document.querySelector(".message-input-container");
      messageContainer.innerHTML = ""; // Clear existing buttons

      const buttonsData = [
          { text: "Nový report" },
          { text: "Aktívne reporty" },
          { text: "Oznámenia" }, // Add this button to the action buttons list
          { text: "Aké sú naše hodnoty?" },
          { text: "Osobný rozvoj" },
      ];

      // Add role-specific action buttons
      const role = "{{ role }}"; // Make sure the role is being passed to the front-end
      if (role === "manager" || role === "leader") {
          buttonsData.push({ text: "Pridať oznámenie" });
          buttonsData.push({ text: "Spravovať hodnoty" });
      }

      const themeClass = localStorage.getItem('themeClass') || "theme-orange";

      if (reportsSubmittedToday === currentDay) {
          buttonsData.splice(0, 1); // Remove "Nový report" if reports submitted today
      }
      buttonsData.forEach((btn, index) => {
          const actionButton = createButton(btn.text, () => {
              if (btn.text === "Nový report") {
                  handleNewReportAction(chatBox);
              } else if (btn.text === "Aktívne reporty") {
                  handleActiveReports();
              } else if (btn.text === "Pridať oznámenie" || btn.text === "Oznámenia") {
                  handleNotifications(); // Placeholder, to be implemented
              } else if (btn.text === "Spravovať hodnoty") {
                  handleManageValues(); // Placeholder, to be implemented
              } else {
                  console.error(`Handler for ${btn.text} not implemented`);
              }
          }, `action-button ${themeClass}`);
          messageContainer.appendChild(actionButton);
          setTimeout(() => {
              actionButton.classList.add('visible');
          }, index * 100); // Animate buttons in order
      });
  };

  // Ensure this function is called after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    displayActionButtons(); // Ensure buttons are updated on page load
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
      // Directly show the action buttons
      userInput.style.display = "none";
      sendButton.style.display = "none";
      displayActionButtons();
      addMessage(`Vítaj späť, ${username}!`, "received");
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
        addMessage(`Nový zákazník sa volá ${customerName}`, "sent");
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
        addMessage(`Bol to druh stretnutia ${meetingType}`, "sent");
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
      addMessage("Bolo to stretnutie online alebo osobne?", "received");
      const onlineButton = createButton("Online stretnutie", () => {
        addMessage("Bolo to online stretnutie", "sent");
        reportData.meetingDetail = "Online stretnutie";
        askForCarBrand();
      }, "meeting-option-button");
      const offlineButton = createButton("Osobné stretnutie", () => {
        addMessage("Bolo to osobné stretnutie", "sent");
        reportData.meetingDetail = "Osobné stretnutie";
        askForCarBrand();
      }, "meeting-option-button");
      messageContainer.appendChild(onlineButton);
      messageContainer.appendChild(offlineButton);
    } else if (meetingType === "Order") {
      addMessage("V akej predajni bolo auto objednané?", "received");
      const presovButton = createButton("V predajni PK Auto Prešov", () => {
        addMessage("Auto bolo objednané v predajni PK Auto Prešov", "sent");
        reportData.orderLocation = "Predajňa PK Auto Prešov";
        askForCarBrand();
      }, "order-option-button");
      const popradButton = createButton("Sklad", () => {
        addMessage("Auto bolo objednané v sklade", "sent");
        reportData.orderLocation = "Sklad";
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
    clearMessageContainer(false);
    addMessage("Zaznačte, o ktorú značku auta mal klient záujem", "received");

    const brands = ["Nissan", "Opel", "Toyota"];
    brands.forEach((brand, index) => {
        const button = createButton(brand, async () => {
            addMessage(`Klient má záujem o ${brand}`, "sent");
            reportData.carBrand = brand;
            await fetchCarModels(brand);
        });

        messageContainer.appendChild(button);
        setTimeout(() => {
            button.classList.add('visible');
        }, index * 100);
    });
  };

  const fetchCarModels = async (brand) => {
    const response = await fetch(`/backoffice/api/car_models/${brand}`);
    const data = await response.json();
    displayCarModels(brand, data.models);
  };

  const displayCarModels = (brand, models) => {
    const messageContainer = document.querySelector(".message-input-container");
    clearMessageContainer(false);
    addMessage("Teraz vyberte model auta", "received");

    models.forEach((model, index) => {
        const button = createButton(model, () => {
            addMessage(`Klient mal záujem o ${model}`, "sent");
            reportData.carModel = model;
            finalizeReport();
        }, "car-model-button");

        messageContainer.appendChild(button);
        setTimeout(() => {
            button.classList.add('visible');
        }, index * 100);
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
              const data = await response.json();

              if (data.message) {
                  addMessage(data.message, "received");

                  // Check if the level was increased and notify the user
                  const currentLevel = parseInt(localStorage.getItem('userLevel'), 10) || 1;
                  const newLevel = data.new_level;

                  if (newLevel && newLevel > currentLevel) {
                      localStorage.setItem('userLevel', newLevel); // Update the stored level
                      addMessage(`Gratulujem! Tvoj level bol zvýšený na ${newLevel}`, "received");
                  }

                  // Show the two new buttons only after the report is successfully submitted
                  setTimeout(() => {
                      showPostSubmissionOptions();
                  }, 2000);
              } else {
                  addMessage("Failed to submit report. Please try again.", "received");
              }
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

          clearMessageContainer(); // Clear existing content

          // Create "Nový zákazník" button
          const newClientButton = createButton("Nový zákazník", () => {
              addMessage("Nový zákazník zvolený", "sent");
              askForCustomerName(); // Handle new customer report
          });
          newClientButton.classList.add('visible');

          // Create "Existujúci zákazník" button
          const existingClientButton = createButton("Existujúci zákazník", () => {
              addMessage("Existujúci zákazník zvolený", "sent");
              showSearchForExistingCustomers(); // Show search for existing customers
          });
          existingClientButton.classList.add('visible');

          messageContainer.appendChild(newClientButton);
          messageContainer.appendChild(existingClientButton);
      }, 500);
  };

  const handleNotifications = async () => {
      try {
          const response = await fetch("/chat/get_notifications");
          const data = await response.json();

          if (response.ok) {
              if (data.notifications && data.notifications.length > 0) {
                  data.notifications.forEach(notification => {
                      const notificationMessage = `<strong>${notification.title}</strong>: ${notification.content}`;
                      addMessage(notificationMessage, "received");
                    
                  });
                  addMessage("Toto sú tvoje nové notifikácie.", "received");
              } else {
                  addMessage("Nemáš žiadné nové upozornenia.", "received");
              }
          } else {
              addMessage(`Problém s načítaním upozornení: ${data.error}`, "received");
          }
      } catch (error) {
          addMessage(`Problém s načítaním upozornení: ${error.message}`, "received");
      }
  };


  const clearCustomerButtons = () => {
      const customerButtons = document.querySelectorAll(".action-button.customer-button");
      customerButtons.forEach(button => button.remove());
  };

  const showSearchForExistingCustomers = () => {
      clearMessageContainer();

      // Prompt user to search for existing customers
      addMessage("Vyhľadajte existujúceho zákazníka podľa mena:", "received");

      const messageContainer = document.querySelector(".message-input-container");

      // Create search input
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "Vyhľadať meno klienta...";
      searchInput.classList.add("search-input");

      searchInput.addEventListener('input', () => {
          const query = searchInput.value.trim();
          if (query.length > 0) {
              handleSearchExistingCustomers(query);
          } else {
              clearCustomerButtons(); // Clear buttons if query is empty
          }
      });

      messageContainer.appendChild(searchInput);
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

