document.addEventListener("DOMContentLoaded", async () => {
    const userContainer = document.getElementById('user-container');

    try {
        const response = await fetch('/backoffice/api/data');
        const data = await response.json();

        console.log('Data fetched from API:', data);  // Debug to see the fetched data

        if (!data) {
            throw new Error("No data found");
        }

        Object.keys(data).forEach(key => {
            console.log('Processing key:', key, 'with value:', data[key]);  // Debug key-value processing
            // Create a container for each key-value pair
            const dataDiv = document.createElement('div');
            dataDiv.classList.add('data-container');

            const keyElement = document.createElement('h3');
            keyElement.textContent = `Key: ${key}`;
            dataDiv.appendChild(keyElement);

            const valueElement = document.createElement('pre');
            valueElement.textContent = `Value: ${JSON.stringify(data[key], null, 2)}`;
            dataDiv.appendChild(valueElement);

            userContainer.appendChild(dataDiv);
        });

        console.log('Finished processing all data.');  // Debug final step
    } catch (error) {
        console.error("Error fetching data:", error);
        const errorText = document.createElement('p');
        errorText.textContent = `Error: ${error.message}`;
        userContainer.appendChild(errorText);
    }
});