const API_URL = 'http://localhost:3000';
let currentUser = null; // 初始化用戶變數

// 監聽 DOM 加載完成後執行初始化
document.addEventListener("DOMContentLoaded", async () => {
    await init();
});

// 生成用戶並加載基本資訊
async function generateUser() {
    try {
        const response = await fetch(`${API_URL}/generate-user`, { method: 'POST' });
        if (!response.ok) throw new Error(`無法生成用戶資訊: ${response.status}`);

        currentUser = await response.json();
        document.getElementById('user-info').innerHTML = `
            <h3>歡迎，${currentUser.name}！目前餘額：${currentUser.balance} 檜木</h3>
        `;

        await loadCart(); // 初次加載購物車
    } catch (error) {
        console.error('生成用戶失敗:', error.message);
        alert(`錯誤：${error.message}`);
    }
}

// 加載商品
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`商品加載失敗: ${response.status}`);

        const products = await response.json();
        const productList = document.getElementById('product-list');

        if (!products || products.length === 0) {
            productList.innerHTML = '<p>目前無商品可用</p>';
            return;
        }

        productList.innerHTML = products.map(product => `
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${API_URL}${product.imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; border-radius: 10px;">
                <div>
                    <h3>${product.name}</h3>
                    <p>價格：${product.price} 檜木</p>
                    <input type="number" id="quantity-${product.id}" min="1" value="1" style="width: 50px;">
                    <button onclick="addToCart(${product.id})">加入購物車</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('商品加載失敗:', error.message);
        alert(`商品加載失敗：${error.message}`);
    }
}

// 加入購物車
async function addToCart(productId) {
    const quantity = parseInt(document.getElementById(`quantity-${productId}`).value);
    if (!quantity || quantity < 1) {
        alert('數量必須至少為 1！');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId, quantity })
        });

        if (!response.ok) throw new Error(`加入購物車失敗：HTTP 狀態 ${response.status}`);
        await loadCart(); // 更新購物車內容
    } catch (error) {
        console.error('加入購物車失敗:', error.message);
        alert(`加入購物車失敗：${error.message}`);
    }
}

// 加載購物車
async function loadCart() {
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.id}`);
        if (!response.ok) throw new Error(`無法獲取購物車內容：HTTP 狀態 ${response.status}`);

        const cartData = await response.json();
        console.log('購物車 API 回應:', cartData);

        const cartList = document.getElementById('cart-list');
        const cartTotal = document.getElementById('cart-total');

        if (!cartData.cart || cartData.cart.length === 0) {
            cartList.innerHTML = '<li style="color: gray; text-align: center;">購物車為空</li>';
            cartTotal.innerHTML = '總金額：0 檜木';
            return;
        }

        cartList.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>商品名稱</th>
                        <th>單價</th>
                        <th>數量</th>
                        <th>總價</th>
                    </tr>
                </thead>
                <tbody>
                    ${cartData.cart.map(item => `
                        <tr>
                            <td>${item.name ?? '未知商品'}</td>
                            <td>${item.price ?? 0} 檜木</td>
                            <td>
                                <button onclick="updateCart(${item.productId}, ${item.quantity - 1})">-</button>
                                ${item.quantity ?? 0}
                                <button onclick="updateCart(${item.productId}, ${item.quantity + 1})">+</button>
                            </td>
                            <td>${item.totalPrice ?? 0} 檜木</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        cartTotal.innerHTML = `總金額：${cartData.totalAmount} 檜木`;
    } catch (error) {
        console.error('購物車加載失敗:', error.message);
        alert(`購物車加載失敗：${error.message}`);
    }
}

// 更新購物車數量
async function updateCart(productId, newQuantity) {
    if (newQuantity < 1) {
        alert('商品數量不能少於 1！');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId, quantity: newQuantity })
        });

        if (!response.ok) throw new Error('更新購物車數量失敗');
        await loadCart(); // 重新加載購物車
    } catch (error) {
        console.error('更新購物車失敗:', error.message);
        alert(`更新購物車失敗：${error.message}`);
    }
}

// 清空購物車
async function clearCart() {
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('清空購物車失敗');
        alert('購物車已清空！');
        await loadCart(); // 清空後重新加載
    } catch (error) {
        console.error('清空購物車失敗:', error.message);
        alert(`清空購物車失敗：${error.message}`);
    }
}

// 結帳功能
async function checkout() {
    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(`交易成功！剩餘檜木：${result.balance}`);
        await loadCart(); // 清空購物車並更新
    } catch (error) {
        console.error('結帳失敗:', error.message);
        alert(`結帳失敗：${error.message}`);
    }
}

// 初始化頁面
async function init() {
    await generateUser();
    await loadProducts();
    await loadCart();
}