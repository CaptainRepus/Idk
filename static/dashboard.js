document.addEventListener("DOMContentLoaded", async () => {
    const userContainer = document.getElementById('user-container');
    const carContainer = document.getElementById('car-container');
    const editModal = document.getElementById('editModal');
    const addCarModal = document.getElementById('addCarModal');
    const confirmModal = document.getElementById('confirmModal');
    const editSpan = editModal.getElementsByClassName('close')[0];
    const addCarSpan = addCarModal.getElementsByClassName('close')[0];
    const confirmSpan = confirmModal.getElementsByClassName('close')[0];
    const editForm = document.getElementById('editForm');
    const addCarForm = document.getElementById('addCarForm');
    const addUserButton = document.getElementById('addUserButton');
    const addCarButton = document.getElementById('addCarButton');
    const backButton = document.getElementById('backButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const tabs = document.querySelectorAll('.tab');
    let userToDelete = null;

    // Close the modals
    editSpan.onclick = function() {
        editModal.style.display = 'none';
    }
    addCarSpan.onclick = function() {
        addCarModal.style.display = 'none';
    }
    confirmSpan.onclick = function() {
        confirmModal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
        if (event.target == addCarModal) {
            addCarModal.style.display = 'none';
        }
        if (event.target == confirmModal) {
            confirmModal.style.display = 'none';
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

        console.log('Data fetched from API:', data);  // Debug to see the fetched data

        if (!data || Object.keys(data).length === 0) {
            throw new Error("No data found");
        }

        // Process users
        data.users.forEach(user => {
            console.log('Processing user:', user);  // Debug user processing
            // Create user box
            const userDiv = document.createElement('div');
            userDiv.classList.add('user-container');

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

            // Create edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                openEditModal(user);
            });

            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                openConfirmModal(user);
            });

            userButtons.appendChild(editButton);
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

            carContainer.appendChild(carDiv);
        });

        console.log('Finished processing all data.');  // Debug final step
    } catch (error) {
        console.error("Error fetching data:", error);
        const errorText = document.createElement('p');
        errorText.textContent = `Error: ${error.message}`;
        userContainer.appendChild(errorText);
    }
});

function openEditModal(user) {
    const modal = document.getElementById('editModal');
    const fullnameInput = document.getElementById('fullname');
    const roleInput = document.getElementById('role');
    const levelInput = document.getElementById('level');
    const userKeyInput = document.getElementById('userKey');
    const pinInput = document.getElementById('pin');

    // Set the current user details in the form
    fullnameInput.value = user.fullname;
    roleInput.value = user.role;
    levelInput.value = user.level;
    userKeyInput.value = user.key;
    pinInput.value = user.pin || '';

    // Display the modal
    modal.style.display = 'block';
}

function openAddCarModal() {
    const modal = document.getElementById('addCarModal');
    const carBrandInput = document.getElementById('carBrand');
    const carModelInput = document.getElementById('carModel');

    // Clear the input fields
    carBrandInput.value = '';
    carModelInput.value = '';

    // Display the modal
    modal.style.display = 'block';
}

function openConfirmModal(user) {
    userToDelete = user;
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'block';
}

document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
    if (userToDelete) {
        await removeUser(userToDelete.key);
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

// Handle form submission for editing or adding user
document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const userKey = document.getElementById('userKey').value;
    const fullname = document.getElementById('fullname').value;
    const role = document.getElementById('role').value;
    const level = document.getElementById('level').value;
    const pin = document.getElementById('pin').value;

    if (pin.length !== 5 || isNaN(pin)) {
        alert('PIN must be a 5-digit number');
        return;
    }

    const url = userKey ? '/backoffice/api/edit_user' : '/backoffice/api/add_user';
    const method = userKey ? 'POST' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: userKey, fullname, role, level, pin }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log(`${userKey ? 'User edited' : 'User added'} successfully:`, result);
            document.getElementById('editModal').style.display = 'none';
            location.reload();  // Reload the page to reflect changes
        } else {
            console.error(`Error ${userKey ? 'editing' : 'adding'} user:`, result);
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

    try {
        const response = await fetch('/backoffice/api/add_car', {
            method: 'POST',
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
