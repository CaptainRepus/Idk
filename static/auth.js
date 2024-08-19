document.addEventListener('DOMContentLoaded', () => {
    const pinInputs = document.querySelectorAll(".pin-input");
    const loginForm = document.getElementById('login-form');

    // Check if there's a saved PIN in local storage
    const savedPin = localStorage.getItem('userPin');
    if (savedPin && pinInputs.length) {
        // Fill the inputs with the saved PIN and submit the form
        savedPin.split('').forEach((digit, index) => {
            if (pinInputs[index]) {
                pinInputs[index].value = digit;
            }
        });

        // Automatically submit the form if all inputs are filled
        loginForm.submit();
    }

    if (pinInputs.length && loginForm) {
        pinInputs.forEach((input, index) => {
            input.addEventListener("input", (e) => {
                const nextInput = pinInputs[index + 1];
                const prevInput = pinInputs[index - 1];

                if (input.value.length > 0) {
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        // Check if all inputs are filled
                        const allFilled = Array.from(pinInputs).every(input => input.value.length > 0);
                        if (allFilled) {
                            // Automatically login when the last input is filled
                            loginForm.submit();
                        }
                    }
                } else if (e.inputType === 'deleteContentBackward' && prevInput) {
                    prevInput.focus();
                }
            });
        });

        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const pin = Array.from(pinInputs).map(input => input.value).join('');

            // Save the PIN in local storage
            localStorage.setItem('userPin', pin);

            fetch('{{ url_for("auth.auth_login") }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `pin1=${pin[0]}&pin2=${pin[1]}&pin3=${pin[2]}&pin4=${pin[3]}&pin5=${pin[4]}`
            })
            .then(response => {
                if (response.redirected) {
                    return response.url;
                } else {
                    return response.text();
                }
            })
            .then(data => {
                if (data.includes('Nesprávny PIN')) {
                    alert('Nesprávny PIN');
                    // Clear the saved PIN in case of an incorrect PIN
                    localStorage.removeItem('userPin');
                } else if (data.includes('/chat/index')) {
                    window.location.href = data;
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
