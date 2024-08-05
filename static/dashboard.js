document.addEventListener("DOMContentLoaded", async () => {
    const userContainer = document.getElementById('user-container');

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
                editUser(user);
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

function editUser(user) {
    console.log('Editing user:', user);  // Add your edit logic here
    // Example: Open a modal with a form to edit user details
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
