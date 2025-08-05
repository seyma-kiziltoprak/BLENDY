let products = [];
const productList = document.querySelector('.listProduct');
const BASE_URL = 'http://localhost:5000'; 


fetch(`${BASE_URL}/api/products`)
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Ürünler yüklenirken bir hata oluştu.');
            });
        }
        return response.json();
    })
    .then(data => {
        products = data;
        renderProducts();
    })
    .catch(error => {
        console.error("Ürünleri çekerken hata oluştu:", error);
        productList.innerHTML = `<p style="text-align:center; color: red;">Ürünler yüklenemedi: ${error.message}</p>`;
    });

function renderProducts() {
    productList.innerHTML = ''; 
    if (products.length === 0) {
        productList.innerHTML = `<p style="text-align:center;">Henüz hiç ürün bulunmamaktadır.</p>`;
        return;
    }
    products.forEach(product => {
        const item = document.createElement('div');
        item.classList.add('item');
        item.innerHTML = `
            <a href="details.html?id=${product.id}">
                <img src="${product.image}" alt="${product.name}">
            </a>
            <a href="details.html?id=${product.id}">
                <h2 class="productInfo">${product.name}</h2>
            </a>
            <a href="details.html?id=${product.id}">
                <p class="product-content">${product.content}</p>
            </a>
            
            <p class="price">${product.price} TL</p>
            <button class="AddToCart" data-product-id="${product.id}">Sepete Ekle</button>
            `;
        productList.appendChild(item);
    });

    
    addAddToCartListeners();
}

function addAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.AddToCart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            addToCart(productId, 1); 
        });
    });
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



function goToDetail(id) {
    window.location.href = `details.html?id=${id}`;
}