// Define the statisticsChart globally
const statisticsModal = document.getElementById('statisticsModal');
const statisticsSpan = statisticsModal.getElementsByClassName('close')[0];
loadingSpinner.style.display = 'block';  // Show the spinner
const notificationContainer = document.getElementById('notification-container');
document.addEventListener("DOMContentLoaded", async () => {
    const userContainer = document.getElementById('user-container');
    const carContainer = document.getElementById('car-container');
    const addCarModal = document.getElementById('addCarModal');
    const confirmModal = document.getElementById('confirmModal');
    const editModal = document.getElementById('editModal');
    const addCarSpan = addCarModal.getElementsByClassName('close')[0];
    const confirmSpan = confirmModal.getElementsByClassName('close')[0];
    const editSpan = editModal.getElementsByClassName('close')[0];
    const addCarForm = document.getElementById('addCarForm');
    const addUserButton = document.getElementById('addUserButton');
    const addCarButton = document.getElementById('addCarButton');
    const backButton = document.getElementById('backButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const tabs = document.querySelectorAll('.tab');
    let userToDelete = null;
    const loadingSpinner = document.getElementById('loadingSpinner');
    const addNotificationModal = document.getElementById('addNotificationModal');
    const addNotificationSpan = addNotificationModal.getElementsByClassName('close')[0];
    const addNotificationButton = document.getElementById('addNotificationButton');
    const notificationContainer = document.getElementById('notification-container'); // Ensure this line is present and defined here


    // Close the modals
    addCarSpan.onclick = function() {
        addCarModal.style.display = 'none';
    }
    confirmSpan.onclick = function() {
        confirmModal.style.display = 'none';
    }
    editSpan.onclick = function() {
        editModal.style.display = 'none';
    }
    // Close the Add Notification Modal
    addNotificationSpan.onclick = function() {
        addNotificationModal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == addCarModal) {
            addCarModal.style.display = 'none';
        }
        if (event.target == confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    }

    tabs.forEach(tab => {
        tab.onclick = function() {
            document.querySelector('.tab-active').classList.remove('tab-active');
            tab.classList.add('tab-active');

            const activeTabContent = document.querySelector('.tab-content-active');
            if (activeTabContent) {
                activeTabContent.classList.remove('tab-content-active');
            }

            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-container`).classList.add('tab-content-active');

            // Toggle Add buttons
            if (tabName === 'user') {
                addUserButton.style.display = 'block';
                addCarButton.style.display = 'none';
                addNotificationButton.style.display = 'none';
            } else if (tabName === 'car') {
                addUserButton.style.display = 'none';
                addCarButton.style.display = 'block';
                addNotificationButton.style.display = 'none';
            } else if (tabName === 'notification') {
                addUserButton.style.display = 'none';
                addCarButton.style.display = 'none';
                addNotificationButton.style.display = 'block';
            }
        }
    });


    // Open the modal for adding a new user
    addUserButton.onclick = function() {
        const editModal = document.getElementById('editModal');
        document.getElementById('fullname').value = '';
        // Clear other form fields here if needed
        editModal.style.display = 'block';
    }


    // Open the modal for adding a new car
    addCarButton.onclick = function() {
        openAddCarModal();
    }
    // Open the modal for adding a new notification
    addNotificationButton.onclick = function() {
        openAddNotificationModal();
    }

    // Navigate back to home page
    backButton.onclick = function() {
        window.location.href = "/";
    }

    try {
        const response = await fetch('/backoffice/api/data');
        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
            throw new Error("No data found");
        }
        // Hide the spinner once the data is loaded
        loadingSpinner.style.display = 'none';

        data.users.forEach(user => {
            console.log('Processing user:', user);  // Debug user processing
            // Create user box
            const userDiv = document.createElement('div');
            userDiv.classList.add('user-container');
            userDiv.dataset.key = user.key;

            const userName = document.createElement('div');
            userName.classList.add('user-name');
            userName.textContent = `${user.fullname}`; // Display the report count
            userDiv.appendChild(userName);

            const userData = document.createElement('div');
            userData.classList.add('user-data');
            userData.innerHTML = `
                <p><strong>Rola:</strong> ${user.role}</p>
                <p><strong>PIN:</strong> ${user.key}</p>
            `;
            userDiv.appendChild(userData);

            // Create buttons container
            const userButtons = document.createElement('div');
            userButtons.classList.add('user-buttons');
            
            // Create Statistics Button
            const statisticsButton = document.createElement('button');
            statisticsButton.classList.add('statistics-button');
            statisticsButton.textContent = 'Štatistika reportov';
            statisticsButton.addEventListener('click', () => {
                openStatisticsModal(user);
            });
            
            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Odstrániť';
            removeButton.addEventListener('click', () => {
                openConfirmModal(user);
            });

            userButtons.appendChild(removeButton);
            userDiv.appendChild(userButtons);
            userButtons.appendChild(statisticsButton);
            userDiv.appendChild(userButtons);

            userContainer.appendChild(userDiv);
        });


        
        // Process cars
        data.cars.forEach(car => {
            console.log('Processing car:', car);  // Debug car processing
            // Create car box
            const carDiv = document.createElement('div');
            carDiv.classList.add('car-container');
            carDiv.dataset.key = car.key;

            const carName = document.createElement('div');
            carName.classList.add('car-name');
            carName.textContent = `${car.brand} ${car.model}`;
            carDiv.appendChild(carName);

            const carData = document.createElement('div');
            carData.classList.add('car-data');
            carData.innerHTML = `
                <p><strong>Brand:</strong> ${car.brand}</p>
                <p><strong>Model:</strong> ${car.model}</p>
            `;
            carDiv.appendChild(carData);

            // Create buttons container
            const carButtons = document.createElement('div');
            carButtons.classList.add('car-buttons');

            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                openConfirmModal(car);
            });

            carButtons.appendChild(removeButton);
            carDiv.appendChild(carButtons);

            carContainer.appendChild(carDiv);
        });
        
        // Process notifications
        data.notifications.forEach(notification => {
            console.log('Processing notification:', notification);

            const notificationDiv = document.createElement('div');
            notificationDiv.classList.add('notification-container');
            notificationDiv.dataset.key = notification.title; // Use title as the key

            const notificationTitle = document.createElement('div');
            notificationTitle.classList.add('notification-title');
            notificationTitle.textContent = notification.title;
            notificationDiv.appendChild(notificationTitle);

            const notificationContent = document.createElement('div');
            notificationContent.classList.add('notification-content');
            notificationContent.textContent = notification.content;
            notificationDiv.appendChild(notificationContent);

            // Create buttons container
            const notificationButtons = document.createElement('div');
            notificationButtons.classList.add('notification-buttons');

            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                openConfirmModal(notification);
            });

            notificationButtons.appendChild(removeButton);
            notificationDiv.appendChild(notificationButtons);

            notificationContainer.appendChild(notificationDiv);
        });


        console.log('Finished processing all data.');  // Debug final step
    } catch (error) {
        console.error("Error fetching data:", error);
        const errorText = document.createElement('p');
        errorText.textContent = `Error: ${error.message}`;
        userContainer.appendChild(errorText);
    }

    // Search functionality for users
    const searchInputUsers = document.getElementById('searchInput');
    searchInputUsers.addEventListener('input', function() {
        const filter = searchInputUsers.value.toLowerCase();
        const userDivs = userContainer.getElementsByClassName('user-container');
        Array.from(userDivs).forEach(userDiv => {
            const userName = userDiv.querySelector('.user-name').textContent;
            if (userName.toLowerCase().includes(filter)) {
                userDiv.style.display = '';
            } else {
                userDiv.style.display = 'none';
            }
        });
    });

    // Search functionality for cars
    const searchInputCars = document.getElementById('searchInputCars');
    searchInputCars.addEventListener('input', function() {
        const filter = searchInputCars.value.toLowerCase();
        const carDivs = carContainer.getElementsByClassName('car-container');
        Array.from(carDivs).forEach(carDiv => {
            const carName = carDiv.querySelector('.car-name').textContent;
            if (carName.toLowerCase().includes(filter)) {
                carDiv.style.display = '';
            } else {
                carDiv.style.display = 'none';
            }
        });
    });
});

function openConfirmModal(item) {
    userToDelete = item;
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'block';
}

document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
    if (userToDelete) {
        if (userToDelete.role) {
            // User deletion
            await removeUser(userToDelete.key);
        } else if (userToDelete.brand) {
            // Car deletion
            await removeCar(userToDelete.key);
        } else if (userToDelete.title) {
            // Notification deletion
            await removeNotification(userToDelete.title);
        }

        // Close the confirm modal
        document.getElementById('confirmModal').style.display = 'none';

        // Remove the corresponding element from the DOM
        document.querySelector(`div[data-key="${userToDelete.key}"]`).remove();
        location.reload();
    }
});


document.getElementById('cancelDeleteButton').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
});

async function removeUser(userKey) {
    try {
        const response = await fetch('/backoffice/api/delete_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: userKey }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('User deleted successfully:', result);
        } else {
            console.error('Error deleting user:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function removeCar(carKey) {
    try {
        const response = await fetch('/backoffice/api/delete_car', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: carKey }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Car deleted successfully:', result);
        } else {
            console.error('Error deleting car:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to open Statistics Modal
function openStatisticsModal(user) {
    const statisticsContent = document.getElementById('userStatisticsContent');
    statisticsContent.textContent = `User ${user.fullname} has uploaded ${user.report_count} reports.`;
    statisticsModal.style.display = 'block';
}

// Close the Statistics Modal
statisticsSpan.onclick = function() {
    statisticsModal.style.display = 'none';
}
window.onclick = function(event) {
    if (event.target == statisticsModal) {
        statisticsModal.style.display = 'none';
    }
}



// Function to open Statistics Modal
// Define the statisticsChart globally
let statisticsChart = null;

async function openStatisticsModal(user) {
    const statisticsModal = document.getElementById('statisticsModal');
    const statisticsLoadingSpinner = document.getElementById('statisticsLoadingSpinner');
    const statisticsSummary = document.getElementById('statisticsSummary');
    const statisticsChartElement = document.getElementById('statisticsChart');
    const carStatistics = document.getElementById('carStatistics');

    // Show the modal and the loading spinner
    statisticsModal.style.display = 'block';
    statisticsLoadingSpinner.style.display = 'block';
    statisticsSummary.style.display = 'none';
    statisticsChartElement.style.display = 'none';
    carStatistics.style.display = 'none';

    try {
        // Simulate network latency with a timeout (optional)
        await new Promise(resolve => setTimeout(resolve, 500));

        const statistics = user.report_statistics;
        const labels = Object.keys(statistics);
        const data = Object.values(statistics);

        // Calculate averages
        const totalReportsLastWeek = data.reduce((sum, value) => sum + value, 0);
        const averageReportsLastWeek = totalReportsLastWeek / data.length;

        const lastFullMonth = new Date();
        lastFullMonth.setMonth(lastFullMonth.getMonth() - 1);
        const daysInLastMonth = new Date(lastFullMonth.getFullYear(), lastFullMonth.getMonth() + 1, 0).getDate();

        const averageReportsLastMonth = totalReportsLastWeek / daysInLastMonth;

        // Update average information in the modal
        document.getElementById('averageReportsWeek').textContent = `Priemerný počet reportov za posledný týždeň: ${averageReportsLastWeek.toFixed(2)}`;
        document.getElementById('averageReportsMonth').textContent = `Priemerný počet reportov za posledný mesiac: ${averageReportsLastMonth.toFixed(2)}`;

        // Display user rank
        const userRank = user.rank;
        const totalUsers = await fetchTotalUsers();
        document.getElementById('userRank').textContent = `Užívateľ je na ${userRank}. mieste`;

        // Define the colors for the chart bars
        const backgroundColors = [
            'rgba(255, 99, 132, 0.6)', // Pink
            'rgba(255, 206, 86, 0.6)', // Yellow
            'rgba(75, 192, 192, 0.6)', // Teal
            'rgba(255, 159, 64, 0.6)', // Orange
            'rgba(153, 102, 255, 0.6)', // Purple
            'rgba(54, 162, 235, 0.6)'  // Blue
        ];

        const borderColors = [
            'rgba(255, 99, 132, 1)', // Pink
            'rgba(255, 206, 86, 1)', // Yellow
            'rgba(75, 192, 192, 1)', // Teal
            'rgba(255, 159, 64, 1)', // Orange
            'rgba(153, 102, 255, 1)', // Purple
            'rgba(54, 162, 235, 1)'  // Blue
        ];

        // Get the canvas context
        const ctx = statisticsChartElement.getContext('2d');

        // Destroy the existing chart instance if it exists and is a Chart instance
        if (statisticsChart instanceof Chart) {
            statisticsChart.destroy();
        }

        // Create a new chart instance with custom column styles
        statisticsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Reports submitted by ${user.fullname}`,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 26,
                                color: 'rgba(255, 99, 132, 1)'
                            },
                            stepSize: 20
                        },
                        title: {
                            display: true,
                            text: 'Number of Reports',
                            font: {
                                size: 20
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 22,
                                color: 'rgba(255, 99, 132, 1)'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                size: 20
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        titleFont: {
                            size: 16
                        },
                        bodyFont: {
                            size: 14
                        },
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                }
            }
        });

        // Fetch and calculate most added car brand and model for the last 7 days
        const carData = await fetchCarStatistics();
        const mostAddedCarBrand = getMostFrequentItem(carData.brands);
        const mostAddedCarModel = getMostFrequentItem(carData.models);

        document.getElementById('mostAddedCarBrand').innerHTML = `Najobľúbenejšia značka auta (posledných 7 dní):<br><h2>${mostAddedCarBrand}</h2>`;
        document.getElementById('mostAddedCarModel').innerHTML = `Najobľúbenejší model auta (posledných 7 dní):<br><h2>${mostAddedCarModel}</h2>`;


        // Hide the loading spinner and show the content
        statisticsLoadingSpinner.style.display = 'none';
        statisticsSummary.style.display = 'block';
        statisticsChartElement.style.display = 'block';
        carStatistics.style.display = 'flex';

    } catch (error) {
        console.error("Error fetching statistics:", error);
        statisticsLoadingSpinner.style.display = 'none';
        // Optionally show an error message to the user here
    }
}


async function fetchTotalUsers() {
    try {
        const response = await fetch('/backoffice/api/data');
        const data = await response.json();
        return data.users.length;
    } catch (error) {
        console.error("Error fetching total users:", error);
        return 0;
    }
}


// Close the Statistics Modal
statisticsSpan.onclick = function() {
    statisticsModal.style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == statisticsModal) {
        statisticsModal.style.display = 'none';
    }
}
// Function to find the most frequent item in an array
function getMostFrequentItem(arr) {
    if (arr.length === 0) return 'N/A';

    const frequency = {};
    let maxCount = 0;
    let mostFrequentItem = arr[0];

    arr.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
        if (frequency[item] > maxCount) {
            maxCount = frequency[item];
            mostFrequentItem = item;
        }
    });

    return mostFrequentItem;
}
// Fetch car data from the backend
async function fetchCarStatistics() {
    try {
        const response = await fetch('/backoffice/api/data');
        const data = await response.json();

        const carBrands = [];
        const carModels = [];

        data.cars.forEach(car => {
            carBrands.push(car.brand);
            carModels.push(`${car.brand} ${car.model}`);
        });

        return { brands: carBrands, models: carModels };
    } catch (error) {
        console.error("Error fetching car statistics:", error);
        return { brands: [], models: [] };
    }
}

// Close the Statistics Modal
statisticsSpan.onclick = function() {
    statisticsModal.style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == statisticsModal) {
        statisticsModal.style.display = 'none';
    }
}



function openAddCarModal() {
    const addCarModal = document.getElementById('addCarModal');
    addCarModal.style.display = 'block';
}

// Handle form submission for adding user
document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const role = document.getElementById('role').value;
    const level = document.getElementById('level').value;
    const pin = document.getElementById('pin').value;

    // PIN validation only for adding users
    if (pin.length !== 5 || isNaN(pin)) {
        alert('PIN must be a 5-digit number');
        return;
    }

    const url = '/backoffice/api/add_user';
    const method = 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullname, role, level, pin }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('User added successfully:', result);
            document.getElementById('editModal').style.display = 'none';
            location.reload();  // Reload the page to reflect changes
        } else {
            console.error('Error adding user:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Open Add Notification Modal
function openAddNotificationModal() {
    addNotificationModal.style.display = 'block';
}

// Search functionality for notifications
const searchInputNotifications = document.getElementById('searchInputNotifications');
searchInputNotifications.addEventListener('input', function() {
    const filter = searchInputNotifications.value.toLowerCase();
    const notificationDivs = notificationContainer.getElementsByClassName('notification-container');
    Array.from(notificationDivs).forEach(notificationDiv => {
        const notificationTitle = notificationDiv.querySelector('.notification-title').textContent;
        if (notificationTitle.toLowerCase().includes(filter)) {
            notificationDiv.style.display = '';
        } else {
            notificationDiv.style.display = 'none';
        }
    });
});



// Handle form submission for adding notification
document.getElementById('addNotificationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = document.getElementById('notificationTitle').value;
    const content = document.getElementById('notificationContent').value;

    const url = '/backoffice/api/add_notification';
    const method = 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Notification added successfully:', result);
            document.getElementById('addNotificationModal').style.display = 'none';
        } else {
            console.error('Error adding notification:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


// Handle form submission for adding car
document.getElementById('addCarForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const carBrand = document.getElementById('carBrand').value;
    const carModel = document.getElementById('carModel').value;

    const url = '/backoffice/api/add_car';
    const method = 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ brand: carBrand, model: carModel }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Car added successfully:', result);
            document.getElementById('addCarModal').style.display = 'none';
            location.reload();  // Reload the page to reflect changes
        } else {
            console.error('Error adding car:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Function to remove a notification
async function removeNotification(notificationTitle) {
    try {
        const response = await fetch('/backoffice/api/delete_notification', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: notificationTitle }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Notification deleted successfully:', result);
        } else {
            console.error('Error deleting notification:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Optionally, close the modal after form submission
document.getElementById('registerForm').addEventListener('submit', function() {
    editModal.style.display = 'none';
});