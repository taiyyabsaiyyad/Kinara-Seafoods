const UPI_ID = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_ID : 'tabsaiyyad@okicici';
const UPI_NAME = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_NAME : 'Kinara Sea Food';
const WA_NUMBER = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.WA_NUMBER : '917045528239';
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJvfrOGBPD5zsRn4_OU6KH7do";

let cart = JSON.parse(localStorage.getItem('kinara_cart') || '[]');
let orders = JSON.parse(localStorage.getItem('kinara_orders') || '[]');
let currentCategory = 'All';
let searchQuery = '';
let paymentMethod = 'COD';
let isVegOnly = false;
let isSSShared = false;

// Initialize the app
function init() {
    loadProfile();
    updateCart();
    renderCategories();
    renderMenu();
    renderOrdersHistory();
    
    // Global function bindings
    window.setCat = setCat;
    window.filterMenu = filterMenu;
    window.clearSearch = clearSearch;
    window.addToCart = addToCart;
    window.changeQty = changeQty;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.placeOrder = placeOrder;
    window.openProfile = openProfile;
    window.closeProfile = closeProfile;
    window.saveProfile = saveProfile;
    window.setPaymentMethod = setPaymentMethod;
    window.confirmOnlinePayment = confirmOnlinePayment;
    window.openOrders = openOrders;
    window.closeOrders = closeOrders;
    window.closeStatus = closeStatus;
    window.scrollToTop = scrollToTop;
    window.toggleVegOnly = toggleVegOnly;
    window.shareOnWhatsApp = shareOnWhatsApp;
    window.toggleSSShared = toggleSSShared;
    window.confirmOnlineOrder = confirmOnlineOrder;
    window.switchTab = switchTab;
    window.GOOGLE_REVIEW_URL = GOOGLE_REVIEW_URL;
}

document.addEventListener('DOMContentLoaded', init);

function switchTab(tab) {
    if (tab === 'home') {
        closeCart();
        closeOrders();
        closeProfile();
        scrollToTop();
    } else if (tab === 'orders') {
        openOrders();
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleVegOnly() {
    isVegOnly = !isVegOnly;
    const circle = document.getElementById('veg-toggle-circle');
    const btn = document.getElementById('veg-toggle');
    if (isVegOnly) {
        circle.style.transform = 'translateX(24px)';
        btn.classList.replace('bg-stone-200', 'bg-green-500');
    } else {
        circle.style.transform = 'translateX(0)';
        btn.classList.replace('bg-green-500', 'bg-stone-200');
    }
    renderMenu();
}

function setPaymentMethod(method) {
    paymentMethod = method;
    const codBtn = document.getElementById('pay-method-cod');
    const onlineBtn = document.getElementById('pay-method-online');
    const paymentSection = document.getElementById('payment-section');
    const placeBtn = document.getElementById('place-order-btn');

    if (method === 'COD') {
        codBtn.classList.add('border-primary', 'bg-red-50', 'text-primary');
        codBtn.classList.remove('border-stone-100', 'text-stone-500');
        onlineBtn.classList.add('border-stone-100', 'text-stone-500');
        onlineBtn.classList.remove('border-primary', 'bg-red-50', 'text-primary');
        paymentSection.classList.add('hidden');
        placeBtn.classList.remove('hidden');
    } else {
        onlineBtn.classList.add('border-primary', 'bg-red-50', 'text-primary');
        onlineBtn.classList.remove('border-stone-100', 'text-stone-500');
        codBtn.classList.add('border-stone-100', 'text-stone-500');
        codBtn.classList.remove('border-primary', 'bg-red-50', 'text-primary');
        
        const total = cart.reduce((acc, item) => acc + (getPrice(item.price) * item.qty), 0);
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${total}&cu=INR&tn=KinaraOrder`;
        document.getElementById('upi-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}`;
        
        paymentSection.classList.remove('hidden');
        placeBtn.classList.add('hidden');
        
        // Reset SS toggle
        isSSShared = false;
        const ssBtn = document.getElementById('ss-toggle-btn');
        const finalBtn = document.getElementById('final-confirm-btn');
        if(ssBtn) {
            ssBtn.classList.remove('bg-green-600');
            ssBtn.classList.add('bg-orange-500');
            ssBtn.textContent = 'Screenshot Shared?';
        }
        if(finalBtn) finalBtn.classList.add('hidden');
    }
}

function shareOnWhatsApp() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (!profile.name || !profile.phone) { showToast('Complete profile first'); openProfile(); return; }
    
    const total = cart.reduce((acc, item) => acc + (getPrice(item.price) * item.qty), 0);
    const orderId = Math.floor(1000 + Math.random() * 9000); // Temp ID for reference
    
    let msg = `*PAYMENT VERIFICATION - KINARA SEA FOOD*\n*Ref ID:* #${orderId}\n*Status:* PAYING ONLINE\n\n*Customer:* ${profile.name}\n\n*ITEMS:*\n`;
    cart.forEach(item => {
        msg += `• ${item.name} x ${item.qty}\n`;
    });
    msg += `\n*TOTAL: ₹${total}*\n\n_I am sharing the payment screenshot now..._`;
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('Shared on WhatsApp. Now confirm below.');
}

function toggleSSShared() {
    isSSShared = !isSSShared;
    const btn = document.getElementById('ss-toggle-btn');
    const finalBtn = document.getElementById('final-confirm-btn');
    
    if (isSSShared) {
        btn.classList.replace('bg-orange-500', 'bg-green-600');
        btn.textContent = 'SS SHARED - DONE';
        finalBtn.classList.remove('hidden');
    } else {
        btn.classList.replace('bg-green-600', 'bg-orange-500');
        btn.textContent = 'Screenshot Shared?';
        finalBtn.classList.add('hidden');
    }
}

function confirmOnlineOrder() {
    if (!isSSShared) { showToast('Please confirm SS shared first'); return; }
    placeOrder(); // This will handle the actual order saving and final WhatsApp msg
}

function openOrders() {
    renderOrdersHistory();
    document.getElementById('orders-modal').classList.add('open');
}

function closeOrders() {
    document.getElementById('orders-modal').classList.remove('open');
}

function renderOrdersHistory() {
    const list = document.getElementById('orders-history-list');
    if (orders.length === 0) {
        list.innerHTML = `<div class="py-12 text-center text-stone-400"><p class="text-sm font-medium">No past orders found</p></div>`;
        return;
    }
    list.innerHTML = [...orders].reverse().map(order => `
        <div class="bg-stone-50 rounded-2xl p-4 border border-stone-100">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="text-[10px] font-black text-stone-400 uppercase">${order.date}</p>
                    <p class="text-xs font-extrabold text-stone-900 mt-0.5">Order #${order.id}</p>
                </div>
                <div class="${order.method === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'} px-3 py-1 rounded-full border border-current/10 text-[9px] font-black uppercase tracking-tighter">
                    ${order.method === 'ONLINE' ? 'Paid Online' : 'COD - Unpaid'}
                </div>
            </div>
            <div class="space-y-1.5 mb-3">
                ${order.items.map(i => `<div class="flex justify-between text-[11px] font-bold text-stone-600"><span>${i.name} x ${i.qty}</span><span>₹${i.price * i.qty}</span></div>`).join('')}
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-stone-200/50">
                <span class="text-xs font-black text-stone-900 uppercase">Total Paid</span>
                <span class="text-sm font-black text-primary">₹${order.total}</span>
            </div>
        </div>
    `).join('');
}

function renderCategories() {
    const row = document.getElementById('cat-row');
    if (!row) return;
    const categories = ['All', ...menuData.categories.map(c => c.name)];
    row.innerHTML = categories.map(cat => {
        const activeClass = cat === currentCategory ? "active-cat" : "bg-white/80 text-stone-500 border-stone-200 hover:bg-white";
        return `<button class="px-6 py-3 rounded-2xl flex-shrink-0 font-black text-[11px] border transition-all whitespace-nowrap uppercase tracking-widest shadow-sm ${activeClass}" onclick="setCat('${cat}')">${cat}</button>`;
    }).join('');
}

function setCat(cat) {
    currentCategory = cat;
    renderCategories();
    renderMenu();
}

function filterMenu() {
    searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const banner = document.getElementById('search-banner');
    if (searchQuery) {
        banner.classList.remove('hidden');
        document.getElementById('search-banner-text').textContent = `Searching for "${searchQuery}"`;
    } else {
        banner.classList.add('hidden');
    }
    renderMenu();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    filterMenu();
}

function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    let items = [];
    menuData.categories.forEach(cat => cat.items.forEach(item => items.push({ ...item, categoryName: cat.name })));
    if (currentCategory !== 'All') items = items.filter(i => i.categoryName === currentCategory);
    if (isVegOnly) items = items.filter(i => i.isVeg === true);
    if (searchQuery) items = items.filter(i => i.name.toLowerCase().includes(searchQuery));

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-stone-400 font-medium">No items found.</div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        const cartItem = cart.find(c => c.id === item.id);
        return `
            <div class="glass-card rounded-2xl overflow-hidden flex flex-col h-full group transition-all hover:shadow-lg active:scale-95 duration-300">
                <div class="relative aspect-square overflow-hidden bg-stone-50/30">
                    <img src="${item.image}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${item.name}">
                    <div class="absolute top-2 right-2 veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}"><div></div></div>
                </div>
                <div class="p-3 flex flex-col flex-1">
                    <h4 class="font-bold text-stone-800 text-[12px] leading-tight mb-2 line-clamp-2">${item.name}</h4>
                    <div class="mt-auto flex items-center justify-between gap-2">
                        <span class="font-black text-stone-900 text-sm">${isNaN(parseFloat(item.price)) ? item.price : '₹' + item.price}</span>
                        ${cartItem ? `
                            <div class="flex items-center gap-3 bg-red-50/80 backdrop-blur rounded-lg p-1 border border-red-100">
                                <button onclick="changeQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center text-primary font-bold bg-white rounded shadow-sm">−</button>
                                <span class="font-black text-primary text-xs w-4 text-center">${cartItem.qty}</span>
                                <button onclick="changeQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center text-white font-bold bg-primary rounded shadow-sm">+</button>
                            </div>
                        ` : `<button onclick="addToCart('${item.id}')" class="bg-white/80 backdrop-blur border border-stone-200 text-stone-700 px-4 py-1.5 rounded-lg font-bold text-[10px] active:bg-stone-50 transition-all uppercase tracking-wider hover:border-primary/50">Add</button>`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCart(itemId) {
    let item;
    menuData.categories.forEach(cat => { const found = cat.items.find(i => i.id === itemId); if (found) item = found; });
    if (item) { cart.push({ ...item, qty: 1 }); updateCart(); showToast(`Added ${item.name} to cart`); }
}

function changeQty(itemId, delta) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx > -1) { cart[idx].qty += delta; if (cart[idx].qty <= 0) cart.splice(idx, 1); updateCart(); }
}

function getPrice(price) {
    return isNaN(parseFloat(price)) ? 0 : parseFloat(price);
}

function updateCart() {
    localStorage.setItem('kinara_cart', JSON.stringify(cart));
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const total = cart.reduce((acc, item) => acc + (getPrice(item.price) * item.qty), 0);
    
    // Update Badge in Bottom Nav
    const badge = document.getElementById('cart-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
            badge.classList.add('cart-pop');
            setTimeout(() => badge.classList.remove('cart-pop'), 300);
        } else {
            badge.classList.add('hidden');
        }
    }

    const totalAmtEl = document.getElementById('cart-total-amt');
    if (totalAmtEl) totalAmtEl.textContent = `₹${total}`;
    
    renderCartItems();
    renderMenu();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list || !footer) return;
    
    if (cart.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center py-10 text-stone-400 text-sm">Your cart is empty</div>`;
        footer.classList.add('hidden'); return;
    }
    footer.classList.remove('hidden');
    list.innerHTML = cart.map(item => {
        const displayPrice = isNaN(parseFloat(item.price)) ? item.price : `₹${item.price}`;
        return `
        <div class="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-100">
            <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover">
            <div class="flex-1"><h5 class="font-bold text-stone-800 text-xs">${item.name}</h5><p class="text-primary font-extrabold text-xs mt-1">${displayPrice}</p></div>
            <div class="flex items-center gap-3 bg-white rounded-lg p-1 border border-stone-200">
                <button onclick="changeQty('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center text-primary font-bold">−</button>
                <span class="font-bold text-stone-900 text-xs">${item.qty}</span>
                <button onclick="changeQty('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center text-primary font-bold">+</button>
            </div>
        </div>
    `}).join('');
}

function openCart() { document.getElementById('cart-modal').classList.add('open'); }
function closeCart() { document.getElementById('cart-modal').classList.remove('open'); }

function placeOrder() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (!profile.name || !profile.phone) { showToast('Complete profile first'); openProfile(); return; }
    const total = cart.reduce((acc, item) => acc + (getPrice(item.price) * item.qty), 0);
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newOrder = { id: orderId, date: date, items: [...cart], total: total, method: paymentMethod };
    orders.push(newOrder);
    localStorage.setItem('kinara_orders', JSON.stringify(orders));

    let msg = `*NEW ORDER - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Status:* ${paymentMethod === 'ONLINE' ? 'PAID ONLINE' : 'COD'}\n\n*Customer:* ${profile.name}\n*Phone:* ${profile.phone}\n*Address:* ${profile.address}\n\n*ITEMS:*\n`;
    cart.forEach(item => {
        const itemTotal = isNaN(parseFloat(item.price)) ? item.price : `₹${item.price * item.qty}`;
        msg += `• ${item.name} x ${item.qty} = ${itemTotal}\n`;
    });
    msg += `\n*TOTAL: ₹${total}*`;
    
    // Open WhatsApp
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Show Order Confirmed Screen for 2.5 seconds
    const overlay = document.getElementById('confirmed-overlay');
    if (overlay) {
        overlay.classList.remove('pointer-events-none');
        overlay.classList.add('opacity-100');
        
        setTimeout(() => {
            overlay.classList.remove('opacity-100');
            overlay.classList.add('pointer-events-none');
            
            closeCart();
            cart = []; // Clear cart after order is confirmed
            updateCart();
            openOrders(); // Go to tracking section
        }, 2500);
    } else {
        closeCart();
        cart = [];
        updateCart();
        openOrders();
    }
}

function openStatus(orderData) {
    document.getElementById('status-total-amt').textContent = `₹${orderData.total}`;
    document.getElementById('status-order-id').textContent = orderData.id;
    document.getElementById('status-items-list').innerHTML = orderData.items.map(item => `<div class="flex justify-between py-2 border-b border-white/5"><p class="text-xs font-bold text-stone-100">${item.name} x ${item.qty}</p><p class="text-xs font-black text-white">₹${item.price * item.qty}</p></div>`).join('');
    document.getElementById('status-modal').classList.add('open');
}

function openProfile() { document.getElementById('profile-modal').classList.add('open'); }
function closeProfile() { document.getElementById('profile-modal').classList.remove('open'); }
function saveProfile() {
    const profile = { name: document.getElementById('prof-name').value, email: document.getElementById('prof-email').value, phone: document.getElementById('prof-phone').value, address: document.getElementById('prof-addr').value };
    if (!profile.name || !profile.phone) { showToast('Required fields missing'); return; }
    localStorage.setItem('kinara_profile', JSON.stringify(profile));
    showToast('Profile saved'); closeProfile();
}
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (profile.name) { 
        const nameEl = document.getElementById('prof-name');
        const emailEl = document.getElementById('prof-email');
        const phoneEl = document.getElementById('prof-phone');
        const addrEl = document.getElementById('prof-addr');
        if(nameEl) nameEl.value = profile.name; 
        if(emailEl) emailEl.value = profile.email; 
        if(phoneEl) phoneEl.value = profile.phone; 
        if(addrEl) addrEl.value = profile.address; 
    }
}
function showToast(text) {
    const toast = document.getElementById('toast'); 
    if(!toast) return;
    toast.textContent = text; toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 0)'; }, 3000);
}

function closeStatus() {
    document.getElementById('status-modal').classList.remove('open');
    cart = []; // Clear cart after order is "placed"
    updateCart();
}

function confirmOnlinePayment() {
    // Placeholder if needed
}
