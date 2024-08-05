document.addEventListener("DOMContentLoaded", async () => {
    const userContainer = document.getElementById('user-container');
    const modal = document.getElementById('editModal');
    const span = document.getElementsByClassName('close')[0];
    const editForm = document.getElementById('editForm');

    // Close the modal when the user clicks on <span> (x)
    span.onclick = function() {
        modal.style.display = 'none';
    }

    // Close the modal when the user clicks anywhere outside of the modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    try {
        const response = await fetch('/backoffice/api/data');
        const data = await response.json();

        console.log('Data fetched from API:', data);  // Debug to see the fetched data

        if (!data || data.length === 0) {
            throw new Error("No data found");
        }

        data.forEach(user => {
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
            removeButton.addEventListener('click', async () => {
                await removeUser(user.key);
                userDiv.remove();  // Remove user from DOM
            });

            userButtons.appendChild(editButton);
            userButtons.appendChild(removeButton);

            userDiv.appendChild(userButtons);

            userContainer.appendChild(userDiv);
        });

        console.log('Finished processing all users.');  // Debug final step
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

    // Set the current user details in the form
    fullnameInput.value = user.fullname;
    roleInput.value = user.role;
    levelInput.value = user.level;
    userKeyInput.value = user.key;

    // Display the modal
    modal.style.display = 'block';
}

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

// Handle form submission for editing user
document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const userKey = document.getElementById('userKey').value;
    const fullname = document.getElementById('fullname').value;
    const role = document.getElementById('role').value;
    const level = document.getElementById('level').value;

    try {
        const response = await fetch('/backoffice/api/edit_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: userKey, fullname, role, level }),
        });
        const result = await response.json();
        if (response.ok) {
            console.log('User edited successfully:', result);
            document.getElementById('editModal').style.display = 'none';
            location.reload();  // Reload the page to reflect changes
        } else {
            console.error('Error editing user:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
