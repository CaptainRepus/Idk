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

    // Handle tab switching
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
            } else {
                addUserButton.style.display = 'none';
                addCarButton.style.display = 'block';
            }
        }
    });

    // Open the modal for adding a new user
    addUserButton.onclick = function() {
        openEditModal({fullname: '', role: '', level: '', key: '', pin: ''});
    }

    // Open the modal for adding a new car
    addCarButton.onclick = function() {
        openAddCarModal();
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

        // Process users
        data.users.forEach(user => {
            console.log('Processing user:', user);  // Debug user processing
            // Create user box
            const userDiv = document.createElement('div');
            userDiv.classList.add('user-container');
            userDiv.dataset.key = user.key;

            const userName = document.createElement('div');
            userName.classList.add('user-name');
            userName.textContent = user.fullname;
            userDiv.appendChild(userName);

            const userData = document.createElement('div');
            userData.classList.add('user-data');
            userData.innerHTML = `
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>Level:</strong> ${user.level}</p>
                <p><strong>PIN:</strong> ${user.key}</p>
            `;
            userDiv.appendChild(userData);

            // Create buttons container
            const userButtons = document.createElement('div');
            userButtons.classList.add('user-buttons');

            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                openConfirmModal(user);
            });

            userButtons.appendChild(removeButton);
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
            await removeUser(userToDelete.key);
        } else {
            await removeCar(userToDelete.key);
        }
        document.getElementById('confirmModal').style.display = 'none';
        document.querySelector(`div[data-key="${userToDelete.key}"]`).remove();  // Remove user from DOM
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

function openEditModal(user) {
    const editModal = document.getElementById('editModal');
    document.getElementById('fullname').value = user.fullname;
    document.getElementById('role').value = user.role;
    document.getElementById('level').value = user.level;
    document.getElementById('userKey').value = user.key;
    document.getElementById('pin').value = user.pin;  // Set the PIN field for adding/editing
    editModal.style.display = 'block';
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
