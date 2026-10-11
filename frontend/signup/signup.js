
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const userDetails = {
        name: name,
        email: email,
        password: password
    };

    try {
        const response = await fetch("http://localhost:3000/user/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userDetails)
        });

        const data = await response.json();
        document.getElementById("message").textContent = data.message;
        console.log(data);

    } catch (error) {
        console.error("Signup failed:", error);
    }
});
