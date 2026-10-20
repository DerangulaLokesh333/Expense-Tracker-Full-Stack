
document
    .getElementById("reset-password-form")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        const pathParts = window.location.pathname.split("/");
        const requestId = pathParts[pathParts.length - 1];

        try {
            const response = await axios.post(
                `http://localhost:3000/password/resetpassword/${requestId}`,
                {
                    password: password
                }
            );

            message.textContent = response.data.message;
        } catch (error) {
            console.error("Password reset error:", error);

            message.textContent =
                error.response?.data?.message ||
                "Something went wrong. Please try again.";
        }
    });
