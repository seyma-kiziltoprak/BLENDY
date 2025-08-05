const BASE_URL = 'http://localhost:5000'; 

fetchProductDetails(); 

async function fetchProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    if (isNaN(id)) {
        document.querySelector('.detailfoto').innerHTML = "";
        document.querySelector('.detailfoto').innerHTML = "<p style='text-align:center;'>Geçersiz ürün ID'si.</p>";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/products/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ürün detayı yüklenirken bir hata oluştu.');
        }

        const product = await response.json();

       
        document.querySelector('.detailfoto').innerHTML = `<img src="${product.imagedetail}" alt="${product.name}" style="border-radius: 20px !important; overflow: hidden;">`;

        document.querySelector('.metinler').innerHTML = `
            <h3>${product.name}</h3>
            <p class="description">${product.description}</p>
            <h5>İçindekiler</h5>
            <p>${product.content}</p>

            <h5>Kalori</h5>
            <p>${product.calorie}</p>

            <div class="icon-group d-flex mt-3 mb-4">
                <img src="https://static.juico.com.tr/assets/images/raw.svg" alt="">
                <img src="https://static.juico.com.tr/assets/images/cold-pressed.svg" alt="">
                <img src="https://static.juico.com.tr/assets/images/vegan.svg" alt="">
                <img src="https://static.juico.com.tr/assets/images/seker-ilavesiz.svg" alt="">
                <img src="https://static.juico.com.tr/assets/images/katkisiz.svg" alt="">
            </div>

            <div class="input-wrapper">
                <select class="form-select">
                    <option selected>Hacim Seçin</option>
                    <option>500 ML</option>
                </select>
                <input type="number" class="quantity-input" value="1" min="1">
            </div>
            <h5 class="price" style="color:#1E1E1E; font-size: 25px;">${product.price} TL</h5>
            <button class="AddToCart" data-product-id="${product.id}">Sepete Ekle</button>
        `;

        
        document.querySelector('.AddToCart').addEventListener('click', () => {
            const quantityInput = document.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);
            addToCart(product.id, quantity);
        });

    } catch (error) {
        console.error("Ürün detaylarını çekerken hata oluştu:", error);
        document.querySelector('.detailfoto').innerHTML = "";
        document.querySelector('.metinler').innerHTML = `<p style='text-align:center; color: red;'>Ürün detayı yüklenemedi: ${error.message}</p>`;
    }
}


async function addToCart(productId, quantity = 1) {
  try {
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Lütfen sepete eklemek için giriş yapın!');
      window.location.href = 'login.html';
      return;
    }

    
    const response = await fetch('http://localhost:5000/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    
    const result = await response.json();
    alert('Ürün sepete eklendi!');
    console.log('Sepet güncellendi:', result);
    
  } catch (error) {
    console.error('Sepete ekleme hatası:', error);
    alert('Hata: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = 'cart.html';
            } else {
                alert('Sepet içeriğinizi görüntülemek için lütfen üye girişi yapın.');
                window.location.href = 'login.html';
            }
        });
    }

});