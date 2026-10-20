
document
    .getElementById("forgot-password")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        const userEmail = document.getElementById("email").value;
        const message = document.getElementById("message");

        try {
            const response = await axios.post(
                "http://localhost:3000/password/forgotpassword",
                {
                    email: userEmail
                }
            );

            message.textContent = response.data.message;
        } catch (error) {
            console.error("Error during password reset request:", error);

            message.textContent =
                error.response?.data?.message ||
                "Something went wrong. Please try again.";
        }
    });
