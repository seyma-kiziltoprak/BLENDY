const BASE_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndFetchCart();
    setupEventListeners();
});

function checkAuthAndFetchCart() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetchCartItems();
}

function setupEventListeners() {
    const applyCouponBtn = document.querySelector('.coupon-container button');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }

    const clearCartButton = document.getElementById('clear-cart-btn')?.querySelector('button');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    const checkoutButton = document.getElementById('checkout-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', goToCheckout);
    }

    const startShoppingButton = document.getElementById('start-shopping');
    if (startShoppingButton) {
        startShoppingButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'product.html';
        });
    }
}



async function fetchCartItems() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("fetchCartItems: Token bulunamadı, login sayfasına yönlendiriliyor.");
            window.location.href = 'login.html';
            return;
        }

        console.log("fetchCartItems: GET /api/cart isteği gönderiliyor...");
        const response = await fetch(`${BASE_URL}/api/cart`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });


        const responseData = await response.json(); 

        if (!response.ok) {
            
            throw new Error(responseData.message || 'Sepet bilgileri alınamadı');
        }

        console.log("fetchCartItems: Sepet öğeleri başarıyla çekildi:", responseData);
        renderCartItems(responseData); 
        updateCartTotals(responseData); 

    } catch (error) {
        console.error('fetchCartItems: Sepet yüklenirken hata:', error);
    }
}



async function addToCart(productId, quantity = 1) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ürün sepete eklenemedi');
        }

        const result = await response.json();
        fetchCartItems();
        return result;
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

function renderCartItems(items) {
    const cartItemsContainer = document.getElementById('cart-items-table');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const clearCartBtnDiv = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    cartItemsContainer.innerHTML = '';

    if (!items || items.length === 0) {
        cartItemsContainer.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">Sepetinizde ürün bulunmamaktadır.</td>
            </tr>
        `;
        if (emptyCartMessage) emptyCartMessage.style.display = "flex";
        if (clearCartBtnDiv) clearCartBtnDiv.style.display = "none";
        if (checkoutBtn) checkoutBtn.style.display = "none";
        return;
    }

    if (emptyCartMessage) emptyCartMessage.style.display = "none";
    if (clearCartBtnDiv) clearCartBtnDiv.style.display = "block";
    if (checkoutBtn) checkoutBtn.style.display = "inline-block";

    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="#" class="remove-item-btn" data-cart-item-id="${item.cart_item_id}">×</a></td>
            <td><img src="${item.image}" alt="${item.name}" width="80"></td>
            <td>${item.name}</td>
            <td>₺${item.price.toFixed(2)}</td>
            <td><input type="number" value="${item.quantity}" min="1" max="${item.stock}" class="cart-quantity-input" data-cart-item-id="${item.cart_item_id}"></td>
            <td class="item-total">₺${itemTotal.toFixed(2)}</td>
        `;
        cartItemsContainer.appendChild(row);
    });

    addQuantityChangeListeners();
    addRemoveItemListeners();
}

function addQuantityChangeListeners() {
    document.querySelectorAll('.cart-quantity-input').forEach(input => {
        input.addEventListener('change', handleQuantityChange);
    });
}

async function handleQuantityChange(event) {
    const input = event.target;
    const cartItemId = input.dataset.cartItemId;
    const row = input.closest('tr');
    const priceText = row.querySelector('td:nth-child(4)').textContent;
    const price = parseFloat(priceText.replace('₺', ''));
    
    let newQuantity = parseInt(input.value);
    const maxStock = parseInt(input.max);

    
    if (isNaN(newQuantity) || newQuantity < 1) {
        input.value = 1;
        newQuantity = 1;
    } else if (newQuantity > maxStock) {
        input.value = maxStock;
        newQuantity = maxStock;
    }

    
    const totalCell = row.querySelector('.item-total');
    totalCell.textContent = `₺${(price * newQuantity).toFixed(2)}`;

    
    await updateCartItemQuantity(cartItemId, newQuantity);
}

async function updateCartItemQuantity(cartItemId, newQuantity) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${BASE_URL}/api/cart/update/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Miktar güncellenemedi');
        }

        
        fetchCartItems();
    } catch (error) {
        console.error('Miktar güncelleme hatası:', error);
        alert('Hata: ' + error.message);
        fetchCartItems(); 
    }
}

function addRemoveItemListeners() {
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', handleRemoveItem);
    });
}

async function handleRemoveItem(event) {
    event.preventDefault();
    const cartItemId = event.target.dataset.cartItemId;
    
    if (confirm('Bu ürünü sepetten kaldırmak istediğinize emin misiniz?')) {
        await removeCartItem(cartItemId);
    }
}

async function removeCartItem(cartItemId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${BASE_URL}/api/cart/remove/${cartItemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ürün sepetten kaldırılamadı');
        }

        fetchCartItems();
    } catch (error) {
        console.error('Ürün kaldırma hatası:', error);
        alert('Hata: ' + error.message);
    }
}

function updateCartTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const shipping = 0;
    const total = subtotal + tax + shipping;

    document.getElementById('cart-subtotal').textContent = `₺${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `₺${tax.toFixed(2)}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₺${total.toFixed(2)}`;
}

async function applyCoupon() {
    const couponCode = document.getElementById('coupon-code')?.value.trim();
    const couponMessage = document.getElementById('coupon-message');

    if (!couponCode) {
        couponMessage.textContent = 'Lütfen kupon kodunu giriniz';
        couponMessage.style.display = 'block';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${BASE_URL}/api/coupons/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ couponCode })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Kupon uygulanamadı');
        }

        couponMessage.style.display = 'none';
        fetchCartItems();
    } catch (error) {
        console.error('Kupon hatası:', error);
        couponMessage.textContent = error.message || 'Kupon uygulanamadı';
        couponMessage.style.display = 'block';
    }
}

async function clearCart() {
    if (!confirm('Sepetinizdeki tüm ürünleri temizlemek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("clearCart: Token bulunamadı, login sayfasına yönlendiriliyor.");
            window.location.href = 'login.html';
            return;
        }

        console.log("clearCart: DELETE /api/cart/clear isteği gönderiliyor...");
        const response = await fetch(`${BASE_URL}/api/cart/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        
        const data = await response.json();
        console.log("clearCart: DELETE yanıtı alındı:", data);

        if (!response.ok) {
           
            throw new Error(data.message || 'Sepet temizlenemedi');
        }

        console.log("clearCart: Sepet başarıyla temizlendi mesajı alındı, şimdi sepeti yeniden çekiyoruz...");
        await fetchCartItems(); 
        console.log("clearCart: fetchCartItems tamamlandı.");

    } catch (error) {
        console.error('clearCart: Sepet temizleme hatası:', error);
        
    }
}


function goToCheckout() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    window.location.href = "checkout.html";
}

function displayMessage(message, type = 'error') {
    alert(message);
    console.log(`[${type.toUpperCase()}] ${message}`);
}