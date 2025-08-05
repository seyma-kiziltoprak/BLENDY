const BASE_URL = 'http://localhost:5000'; 

document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary(); 
    setupPlaceOrderButton(); 
});

async function renderCheckoutSummary() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Sipariş oluşturmak için lütfen giriş yapın.");
        window.location.href = 'login.html'; 
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/cart`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const cartItems = await response.json();

        if (!response.ok) {
            displayMessage(`Hata: ${cartItems.message || 'Sepet bilgileri çekilemedi.'}`, 'error');
            return;
        }

        const checkoutItemsTable = document.getElementById('checkout-items');
        if (!checkoutItemsTable) {
            console.error("HTML'de 'checkout-items' ID'li bir tablo bulunamadı.");
            return;
        }
        checkoutItemsTable.innerHTML = ''; 

        let subtotal = 0;

        if (cartItems.length === 0) {
            checkoutItemsTable.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Sepetiniz boş. <a href="product.html">Alışverişe Başlayın</a></td></tr>`;
            const placeOrderButton = document.getElementById('placeOrderButton');
            if (placeOrderButton) {
                placeOrderButton.disabled = true; 
            }
            return;
        }

        cartItems.forEach(item => {
            const row = document.createElement('tr');
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            row.innerHTML = `
                <td>${item.name}</td>
                <td>₺${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₺${itemTotal.toFixed(2)}</td>
            `;
            checkoutItemsTable.appendChild(row);
        });

        const taxRate = 0.18;
        const shippingCost = subtotal >= 500 ? 0 : 30; 
        const tax = subtotal * taxRate;
        const total = subtotal + tax + shippingCost; 

        const subtotalEl = document.getElementById('checkout-subtotal');
        const taxEl = document.getElementById('checkout-tax');
        const shippingEl = document.getElementById('checkout-shipping');
        const discountEl = document.getElementById('checkout-discount');
        const totalAmountEl = document.getElementById('checkout-total-price'); 

        if (subtotalEl) subtotalEl.innerText = `₺${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.innerText = `₺${tax.toFixed(2)}`;
        if (shippingEl) shippingEl.innerText = shippingCost === 0 ? "Ücretsiz" : `₺${shippingCost.toFixed(2)}`;
        if (discountEl) discountEl.innerText = `₺0.00`; 
        if (totalAmountEl) totalAmountEl.innerText = `₺${total.toFixed(2)}`;

    } catch (error) {
        console.error("Sepet özeti yüklenirken hata:", error);
        displayMessage("Sepet özeti yüklenirken bir ağ hatası oluştu.", 'error');
    }
}

function setupPlaceOrderButton() {
    const placeOrderButton = document.getElementById('placeOrderButton');
    if (placeOrderButton) {
        
        const paymentForm = document.getElementById('paymentForm'); 
        if (paymentForm) {
            paymentForm.addEventListener('submit', placeOrder);
        } else {
            
            placeOrderButton.addEventListener('click', placeOrder);
        }
    }
}

async function placeOrder(event) {
    event.preventDefault(); 

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Sipariş oluşturmak için lütfen giriş yapın.");
        window.location.href = 'login.html';
        return;
    }

    
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const addressEl = document.getElementById('address');
    const neighborhoodEl = document.getElementById('neighborhood');
    const provinceEl = document.getElementById('province');
    const districtEl = document.getElementById('district');
    const postalCodeEl = document.getElementById('postal-code');
    const deliveryDateEl = document.getElementById('delivery-date');

    const paymentMethodEl = document.getElementById('payment-method');
    const orderNoteEl = document.getElementById('order-note');

    const cardNumberEl = document.getElementById('card-number');
    const cardExpirationEl = document.getElementById('card-expiration');
    const cardCvcEl = document.getElementById('card-cvc'); 
    const cardNameEl = document.getElementById('card-name'); 

    
    if (!nameEl || !emailEl || !phoneEl || !addressEl || !neighborhoodEl || !provinceEl || !districtEl || !postalCodeEl || !deliveryDateEl ||
        !paymentMethodEl || !cardNumberEl || !cardExpirationEl || !cardCvcEl || !cardNameEl) {
        console.error("Hata: Gerekli ödeme veya teslimat formu elementleri bulunamadı. Lütfen checkout.html'deki ID'leri kontrol edin ve 'card-name' alanını eklediğinizden emin olun.");
        displayMessage("Formda eksik alanlar var. Lütfen tüm bilgileri doldurun ve 'Kart Üzerindeki Ad Soyad' alanını eklediğinizden emin olun.", 'error');
        return;
    }

    const name = nameEl.value;
    const email = emailEl.value;
    const phone = phoneEl.value;
    const address = addressEl.value;
    const neighborhood = neighborhoodEl.value;
    const province = provinceEl.value;
    const district = districtEl.value;
    const postalCode = postalCodeEl.value;
    const deliveryDate = deliveryDateEl.value;

    const paymentMethod = paymentMethodEl.value;
    const orderNote = orderNoteEl.value;

    const cardNumber = cardNumberEl.value;
    const cardExpiration = cardExpirationEl.value;
    const cardCvc = cardCvcEl.value;
    const cardName = cardNameEl.value;

    
    if (!name || !email || !phone || !address || !neighborhood || !province || !district || !postalCode || !deliveryDate ||
        !paymentMethod || !cardNumber || !cardExpiration || !cardCvc || !cardName) {
        displayMessage("Lütfen tüm zorunlu ödeme ve teslimat bilgilerini doldurun.", 'error');
        return;
    }

    
    if (cardNumber.length < 16 || cardExpiration.length < 5 || cardCvc.length < 3) {
        displayMessage("Lütfen geçerli kart bilgileri girin.", 'error');
        return;
    }

    
    const fullShippingAddress = `${address}, ${neighborhood} Mah., ${district}/${province}, Posta Kodu: ${postalCode}`;

    try {
        const cartResponse = await fetch(`${BASE_URL}/api/cart`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const cartData = await cartResponse.json();

        if (!cartResponse.ok) {
            displayMessage(`Hata: ${cartData.message || 'Sepet bilgileri alınamadı.'}`, 'error');
            return;
        }

        if (cartData.length === 0) {
            displayMessage("Sepetiniz boş, sipariş oluşturulamaz.", 'error');
            window.location.href = 'product.html';
            return;
        }

        let totalAmount = 0;
        const orderItems = cartData.map(item => {
            totalAmount += item.price * item.quantity;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            };
        });

        const taxRate = 0.18;
        const shippingCost = totalAmount >= 500 ? 0 : 30;
        const tax = totalAmount * taxRate;
        const finalTotalAmount = totalAmount + tax + shippingCost;

        const orderDetails = {
            shippingAddress: fullShippingAddress, 
            paymentMethod,
            orderNote,
            totalAmount: finalTotalAmount.toFixed(2),
            cartItems: orderItems,
            
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            requestedDeliveryDate: deliveryDate
        };

        const response = await fetch(`${BASE_URL}/api/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderDetails)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(result.message, 'success');
            localStorage.setItem('invoiceData', JSON.stringify({
                orderId: result.orderId,
                name: name,
                email: email, 
                address: fullShippingAddress, 
                paymentMethod: paymentMethod,
                deliveryDate: deliveryDate, 
                items: cartData.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                subtotal: totalAmount,
                tax: tax,
                shipping: shippingCost,
                discount: 0,
                total: finalTotalAmount
            }));
            window.location.href = 'index.html';
        } else {
            displayMessage(`Sipariş oluşturulurken hata: ${result.message || 'Bilinmeyen hata.'}`, 'error');
        }

    } catch (error) {
        console.error("Sipariş oluşturulurken ağ hatası:", error);
        displayMessage("Sipariş oluşturulurken bir ağ hatası oluştu.", 'error');
    }
}

function displayMessage(message, type) {
    alert(message);
}