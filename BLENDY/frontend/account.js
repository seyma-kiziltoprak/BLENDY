const API_BASE_URL = "http://localhost:5000"; 
document.addEventListener("DOMContentLoaded", function() {
   
    loadUserInfo();
    
    
    document.getElementById("password-change-form").addEventListener("submit", changePassword);
});

function showError(elementId, message) { 
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function loadUserInfo() {
    const token = localStorage.getItem("token");
    
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    
    fetch(`${API_BASE_URL}/api/profile`, { 
    method: "GET",
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Kullanıcı bilgileri alınamadı");
        }
        return response.json();
    })
    .then(data => {
        document.getElementById("user-name").textContent = data.name;
        document.getElementById("user-email").textContent = data.email;
        document.getElementById("user-role").textContent = data.role === "user" ? "Standart Üye" : "Admin";
    })
    .catch(error => {
        console.error("Hata:", error);
        alert("Kullanıcı bilgileri yüklenirken hata oluştu");
    });
}

async function changePassword(e) {
    e.preventDefault();

    
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        window.location.href = "login.html";
        return;
    }

    
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    
    let isValid = true;
    document.querySelectorAll(".error-message").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });

    if (!oldPassword) {
        showError("old-password-error", "Eski şifre boş olamaz");
        isValid = false;
    }
    if (!newPassword) {
        showError("new-password-error", "Yeni şifre boş olamaz");
        isValid = false;
    } else if (newPassword.length < 6) {
        showError("new-password-error", "Şifre en az 6 karakter olmalı");
        isValid = false;
    }
    if (newPassword !== confirmPassword) {
        showError("confirm-password-error", "Şifreler eşleşmiyor");
        isValid = false;
    }
    if (!isValid) return;

    try {
        
        const response = await fetch("http://localhost:5000/api/auth/changePassword", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Şifre değiştirilemedi");
        }

        
        alert("Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...");
        
        
        localStorage.removeItem("token");
        
        
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Hata:", error);
        if (error.message === "Eski şifre yanlış") {
            showError("old-password-error", error.message);
        } else {
            showError("old-password-error", "Bir hata oluştu: " + error.message);
        }
    }
}


function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = "block";
}