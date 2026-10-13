
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        
if (response.ok) {
    alert(data.message);
    window.location.href = "/frontend/expense/expense.html";
} else {
    document.getElementById("message").textContent = data.message;
}

    } catch (error) {
        document.getElementById("message").textContent =
            "Unable to connect to the server";
    }
});
