document.addEventListener("DOMContentLoaded", () => {

  /* =====================
     SIGNUP
  ====================== */
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // 🔥 STOPS PAGE RELOAD

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Signup failed");
          return;
        }

        alert("Signup successful!");
        window.location.href = "/login.html";

      } catch (err) {
        alert("Server error");
        console.error(err);
      }
    });
  }

  /* =====================
     LOGIN
  ====================== */
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // 🔥 STOPS PAGE RELOAD

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Login failed");
          return;
        }

        // ✅ SAVE TOKEN
        localStorage.setItem("token", data.token);

        alert("Login successful!");
        window.location.href = "/dashboard.html";

      } catch (err) {
        alert("Server error");
        console.error(err);
      }
    });
  }

});
