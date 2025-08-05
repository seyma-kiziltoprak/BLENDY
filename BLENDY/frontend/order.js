const BASE_URL = 'http://localhost:5000'; 

document.addEventListener("DOMContentLoaded", () => {
    fetchUserOrders();
});

async function fetchUserOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById("no-orders-message").style.display = "block";
        document.getElementById("no-orders-message").innerHTML = `
            <h1 class="fancy-title"><span class="emoji">😔</span> Henüz siparişiniz yok!</h1>
            <p class="subtitle">Sipariş geçmişinizi görüntülemek için <a href="login.html">giriş yapmanız</a> gerekmektedir.</p>
            <button class="create-order-btn" onclick="window.location.href='product.html'">
                <i class="fas fa-shopping-basket"></i> Hemen Alışverişe Başla
            </button>
        `;
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await response.json();
        const list = document.getElementById("order-list");
        const noOrdersMessage = document.getElementById("no-orders-message");

        if (!response.ok) {
            console.error("Siparişler çekilirken hata:", orders.message);
            document.getElementById("no-orders-message").style.display = "block";
            document.getElementById("no-orders-message").innerHTML = `
                <h1 class="fancy-title"><span class="emoji">⚠️</span> Hata oluştu!</h1>
                <p class="subtitle">Sipariş geçmişi yüklenemedi: ${orders.message || 'Bilinmeyen hata.'}</p>
                <button class="create-order-btn" onclick="window.location.href='product.html'">
                    <i class="fas fa-shopping-basket"></i> Alışverişe Başla
                </button>
            `;
            return;
        }

        if (orders.length === 0) {
            document.getElementById("no-orders-message").style.display = "block";
            document.getElementById("no-orders-message").innerHTML = `
                <h1 class="fancy-title"><span class="emoji">😔</span> Henüz siparişiniz yok!</h1>
                <p class="subtitle">Sipariş geçmişinizi görüntülemek için <a href="product.html">alışverişe başlayın</a>.</p>
                <button class="create-order-btn" onclick="window.location.href='product.html'">
                    <i class="fas fa-shopping-basket"></i> Hemen Alışverişe Başla
                </button>
            `;
            return;
        }

        document.getElementById("no-orders-message").style.display = "none";
        list.innerHTML = ''; 

        orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";

            
            const orderNoteHtml = order.order_note ? `<p>Sipariş Notu: ${order.order_note}</p>` : '';

            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-image">
                        <div class="item-details">
                            <p class="item-name">${item.name}</p>
                            <p class="item-qty-price">Adet: ${item.quantity} x ₺${item.price.toFixed(2)} = ₺${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                itemsHtml = `<p>Ürün bilgisi bulunamadı.</p>`;
            }

            card.innerHTML = `
                <h3>Sipariş ID: ${order.order_id}</h3>
                <p>Tarih: ${new Date(order.order_date).toLocaleDateString('tr-TR')}</p>
                <p>Teslimat Adresi: ${order.shipping_address}</p>
                <p>Ödeme Yöntemi: ${order.payment_method}</p>
                ${orderNoteHtml}
                <h4>Sipariş Detayları:</h4>
                <div class="order-items-container">
                    ${itemsHtml}
                </div>
                <p class="order-total">Toplam Tutar: <strong>₺${parseFloat(order.total_amount).toFixed(2)}</strong></p>
                <p class="order-status">Durum: <span>${order.order_status}</span></p>
                <button class="order-detail-btn" onclick="goToInvoice(${order.order_id})">Fatura Detay</button>
            `;
            list.appendChild(card);
        });

    } catch (error) {
        console.error("Sipariş geçmişi çekilirken ağ hatası:", error);
        document.getElementById("no-orders-message").style.display = "block";
        document.getElementById("no-orders-message").innerHTML = `
            <h1 class="fancy-title"><span class="emoji">⚠️</span> Ağ bağlantı hatası!</h1>
            <p class="subtitle">Sipariş geçmişi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.</p>
            <button class="create-order-btn" onclick="window.location.href='product.html'">
                <i class="fas fa-shopping-basket"></i> Alışverişe Başla
            </button>
        `;
    }
}


function goToInvoice(orderId) {
    
    window.location.href = `invoice.html?orderId=${orderId}`;
}
