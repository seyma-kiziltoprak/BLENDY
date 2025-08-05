document.addEventListener("DOMContentLoaded", function() {
    
    const loginBtn = document.getElementById("login-btn");
    const userMenu = document.getElementById("user-menu");

    if (loginBtn && userMenu) {
        loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const token = localStorage.getItem("token");

            if (token) {
                userMenu.classList.toggle("hidden");
                
                searchForm.classList.remove('active');
                navbar.classList.remove('active');
            } else {
                window.location.href = "login.html";
            }
        });
    }

    
    let searchForm = document.querySelector('.search-form');
    let navbar = document.querySelector('.navbar');

    if (document.querySelector('#search-btn')) {
        document.querySelector('#search-btn').onclick = () => {
            searchForm.classList.toggle('active');
            navbar.classList.remove('active');
            if (userMenu) userMenu.classList.add('hidden');
        };
    }

    if (document.querySelector('#menu-btn')) {
        document.querySelector('#menu-btn').onclick = () => {
            navbar.classList.toggle('active');
            searchForm.classList.remove('active');
            if (userMenu) userMenu.classList.add('hidden');
        };
    }

    window.onscroll = () => {
        if (searchForm) searchForm.classList.remove('active');
        if (navbar) navbar.classList.remove('active');
        if (userMenu) userMenu.classList.add('hidden');
    };

    // Swiper 
    const swiperContainer = document.querySelector(".swiper");
    if (swiperContainer) {
        var swiper = new Swiper(".review-slider", {
            loop: true,
            spaceBetween: 20,
            autoplay: {
                delay: 3500,
                disableOnInteraction: false,
            },
            centeredSlides: true,
            breakpoints: {
                0: {
                    slidesPerView: 1,
                },
                768: {
                    slidesPerView: 2,
                },
                1020: {
                    slidesPerView: 3,
                },
            },
        });
    }

    // Çıkış yapma işlemi
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("Çıkış yapıldı.");
            window.location.href = "index.html";
        });
    }

    // Register formu için olay dinleyicisi
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            };

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                
                if (response.ok) {
                    alert("Üyelik başarılı! Giriş sayfasından giriş yapabilirsiniz...");
                    window.location.href = "login.html";
                } else {
                    alert(data.message || "Üyelik başarısız.");
                }
            } catch (error) {
                console.error("Hata:", error);
                alert("Sunucu hatası oluştu.");
            }
        });
    }
});