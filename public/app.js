document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     SIGN UP
  ========================== */
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // 🔴 VERY IMPORTANT (stops page reload)

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Account created successfully!");
          window.location.href = "/login.html";
        } else {
          alert(data.message || "Error creating account. Please try again.");
        }

      } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
      }
    });
  }


  /* =========================
     LOGIN
  ========================== */
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // 🔴 VERY IMPORTANT

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Login successful!");
          window.location.href = "/dashboard.html";
        } else {
          alert(data.message || "Invalid credentials");
        }

      } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
      }
    });
  }

});
