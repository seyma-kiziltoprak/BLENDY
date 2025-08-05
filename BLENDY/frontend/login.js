document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

 
  const email = document.querySelector('.login-form input[type="email"]').value;
  const password = document.querySelector('.login-form input[type="password"]').value;

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Giriş başarılı!");

   
    localStorage.setItem("token", data.token);
    window.location.href = "index.html";

    } else {
      alert(data.message || "Giriş başarısız.");
    }

  } catch (error) {
    console.error("Hata:", error);
    alert("Sunucu hatası oluştu.");
  }
});
