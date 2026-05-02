const UPI_ID = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_ID : 'tabsaiyyad@okicici';
const UPI_NAME = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_NAME : 'Kinara Sea Food';
const WA_NUMBER = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.WA_NUMBER : '917045528239';
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJvfrOGBPD5zsRn4_OU6KH7do";

const HOTEL_COORDS = { lat: 19.033, lng: 73.016 }; // Nerul Sector 20
const DELIVERY_RATE = 20; // Rs per KM after 1km free

let cart = JSON.parse(localStorage.getItem('kinara_cart') || '[]');
let orders = JSON.parse(localStorage.getItem('kinara_orders') || '[]');
let currentCategory = 'All';
let searchQuery = '';
let paymentMethod = 'COD';
let isVegOnly = false;
let isSSShared = false;
let orderMode = 'DELIVERY';
let currentTip = 0;
let map = null;
let historyMap = null;

// Initialize the app
function init() {
    loadProfile();
    updateCart();
    renderCategories();
    renderMenu();
    renderOrdersHistory();
    
    // Global function bindings
    window.setOrderMode = setOrderMode;
    window.setTip = setTip;
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
    window.detectLocation = detectLocation;
    window.openTracking = openTracking;
    window.closeTracking = closeTracking;
}

document.addEventListener('DOMContentLoaded', init);

function switchTab(tab) {
    const homeBtn = document.getElementById('nav-home');
    const ordersBtn = document.getElementById('nav-orders');
    
    // Reset states
    homeBtn.classList.replace('text-primary', 'text-stone-400');
    ordersBtn.classList.replace('text-primary', 'text-stone-400');
    homeBtn.querySelector('.bg-primary')?.classList.add('hidden');
    ordersBtn.querySelector('.bg-primary')?.classList.add('hidden');

    if (tab === 'home') {
        closeCart();
        closeOrders();
        closeProfile();
        scrollToTop();
        homeBtn.classList.replace('text-stone-400', 'text-primary');
        homeBtn.querySelector('.bg-primary')?.classList.remove('hidden');
    } else if (tab === 'orders') {
        openOrders();
        ordersBtn.classList.replace('text-stone-400', 'text-primary');
        ordersBtn.querySelector('.bg-primary')?.classList.remove('hidden');
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) { return deg * (Math.PI / 180); }

function setOrderMode(mode) {
    orderMode = mode;
    const delBtn = document.getElementById('mode-delivery');
    const dineBtn = document.getElementById('mode-dinein');
    const dineStatus = document.getElementById('dine-in-status');
    const dineFields = document.getElementById('dine-in-fields');
    const dinePayBtn = document.getElementById('pay-method-dine');
    const codBtn = document.getElementById('pay-method-cod');

    if (mode === 'DELIVERY') {
        delBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        delBtn.classList.remove('text-stone-400');
        dineBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        dineBtn.classList.add('text-stone-400');
        dineStatus.classList.add('hidden');
        dineFields.classList.add('hidden');
        
        dinePayBtn.classList.add('hidden');
        codBtn.classList.remove('hidden');
        
        // Adjust grid for 2 columns
        document.getElementById('payment-modes-container').classList.replace('grid-cols-2', 'grid-cols-2'); // No change needed if always 2
        
        setPaymentMethod('COD');
    } else {
        dineBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        dineBtn.classList.remove('text-stone-400');
        delBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        delBtn.classList.add('text-stone-400');
        dineStatus.classList.remove('hidden');
        dineFields.classList.remove('hidden');
        
        dinePayBtn.classList.remove('hidden');
        codBtn.classList.add('hidden');
        
        setPaymentMethod('DINE_PAY');
    }
    updateCart();
}

function setTip(amount) {
    currentTip = amount;
    
    // Update button states
    [0, 20, 50, 100].forEach(a => {
        const btn = document.getElementById(`tip-btn-${a}`);
        if (!btn) return;
        if (a === amount) {
            btn.classList.add('bg-white', 'shadow-sm', 'text-primary', 'border-primary/20');
            btn.classList.remove('text-stone-400', 'hover:bg-stone-50');
        } else {
            btn.classList.remove('bg-white', 'shadow-sm', 'text-primary', 'border-primary/20');
            btn.classList.add('text-stone-400', 'hover:bg-stone-50');
        }
    });
    
    document.getElementById('tip-amt-display').textContent = `₹${amount}`;
    updateCart();
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
    const dineBtn = document.getElementById('pay-method-dine');
    const paymentSection = document.getElementById('payment-section');
    const placeBtn = document.getElementById('place-order-btn');

    // Reset all
    [codBtn, onlineBtn, dineBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('border-primary', 'bg-white', 'shadow-sm');
        btn.classList.add('border-stone-100', 'bg-stone-50/50');
        const icon = btn.querySelector('.material-symbols-outlined');
        const label = btn.querySelector('span:not(.material-symbols-outlined)');
        if (icon) icon.classList.replace('text-primary', 'text-stone-400');
        if (label) label.classList.replace('text-stone-900', 'text-stone-400');
    });

    const activeBtn = method === 'COD' ? codBtn : method === 'DINE_PAY' ? dineBtn : onlineBtn;
    if (activeBtn) {
        activeBtn.classList.add('border-primary', 'bg-white', 'shadow-sm');
        activeBtn.classList.remove('border-stone-100', 'bg-stone-50/50');
        const icon = activeBtn.querySelector('.material-symbols-outlined');
        const label = activeBtn.querySelector('span:not(.material-symbols-outlined)');
        if (icon) icon.classList.replace('text-stone-400', 'text-primary');
        if (label) label.classList.replace('text-stone-400', 'text-stone-900');
    }

    if (method === 'ONLINE') {
        const { grandTotal } = calculateCartTotals();
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${grandTotal}&cu=INR&tn=KinaraOrder`;
        document.getElementById('upi-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}`;
        paymentSection.classList.remove('hidden');
        placeBtn.classList.add('hidden');
        
        isSSShared = false;
        const ssBtn = document.getElementById('ss-toggle-btn');
        const finalBtn = document.getElementById('final-confirm-btn');
        if(ssBtn) {
            ssBtn.classList.remove('bg-green-600', 'text-white');
            ssBtn.textContent = 'I have shared the SS';
        }
        if(finalBtn) finalBtn.classList.add('hidden');
    } else {
        paymentSection.classList.add('hidden');
        placeBtn.classList.remove('hidden');
    }
}

function calculateCartTotals() {
    const itemTotal = cart.reduce((acc, item) => acc + (getPrice(item.price) * item.qty), 0);
    let deliveryFee = 0;
    let distance = 0;

    if (orderMode === 'DELIVERY' && userCoords) {
        distance = calculateDistance(HOTEL_COORDS.lat, HOTEL_COORDS.lng, userCoords.lat, userCoords.lng);
        if (distance > 1) {
            deliveryFee = Math.ceil((distance - 1) * DELIVERY_RATE);
        }
    }
    
    return { itemTotal, deliveryFee, tip: currentTip, grandTotal: itemTotal + deliveryFee + currentTip, distance };
}

function shareOnWhatsApp() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (!profile.name || !profile.phone) { showToast('Complete profile first'); openProfile(); return; }
    
    const { grandTotal } = calculateCartTotals();
    const orderId = Math.floor(1000 + Math.random() * 9000);
    
    let msg = `*PAYMENT VERIFICATION - KINARA SEA FOOD*\n*Ref ID:* #${orderId}\n*Status:* PAYING ONLINE\n\n*Customer:* ${profile.name}\n\n*ITEMS:*\n`;
    cart.forEach(item => { msg += `• ${item.name} x ${item.qty}\n`; });
    msg += `\n*TOTAL: ₹${grandTotal}*\n\n_I am sharing the payment screenshot now..._`;
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function toggleSSShared() {
    isSSShared = !isSSShared;
    const btn = document.getElementById('ss-toggle-btn');
    const finalBtn = document.getElementById('final-confirm-btn');
    if (isSSShared) {
        btn.classList.add('bg-green-600', 'text-white', 'border-green-500');
        btn.classList.remove('bg-white/5', 'text-white/60', 'border-white/10');
        btn.textContent = 'SCREENSHOT SHARED - DONE';
        finalBtn.classList.remove('hidden');
    } else {
        btn.classList.remove('bg-green-600', 'text-white', 'border-green-500');
        btn.classList.add('bg-white/5', 'text-white/60', 'border-white/10');
        btn.textContent = 'I have shared the SS';
        finalBtn.classList.add('hidden');
    }
}

function confirmOnlineOrder() {
    if (!isSSShared) { showToast('Please confirm SS shared first'); return; }
    placeOrder();
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
    list.innerHTML = [...orders].reverse().map(order => {
        const isDineIn = order.mode === 'DINE_IN';
        const isPayAfter = order.method === 'DINE_PAY';
        
        return `
            <div class="bg-stone-50 rounded-[28px] p-5 border border-stone-100 mb-4 animate-slide-up">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-[9px] font-black text-stone-300 uppercase tracking-widest">${order.date}</p>
                        <p class="text-[11px] font-extrabold text-stone-900 mt-0.5">ORDER #${order.id}</p>
                        ${isDineIn ? `<p class="text-[9px] font-black text-green-600 uppercase mt-1">Table ${order.table}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-2 items-end">
                        <div class="${order.method === 'ONLINE' ? 'bg-green-100 text-green-700' : isPayAfter ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-600'} px-3 py-1 rounded-full border border-current/10 text-[9px] font-black uppercase tracking-tighter">
                            ${order.method === 'ONLINE' ? 'Paid Online' : isPayAfter ? 'Pay After Meal' : 'COD - Unpaid'}
                        </div>
                        ${!isDineIn ? `
                        <button onclick="openTracking('${order.id}')" class="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest mt-1">
                            <span class="material-symbols-outlined text-[14px]">my_location</span> Track Map
                        </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="space-y-2 mb-4 bg-white/50 p-3 rounded-2xl border border-stone-100/50">
                    ${order.items.map(i => `
                        <div class="flex justify-between text-[10px] font-bold text-stone-600">
                            <span>${i.name} <span class="text-stone-300">x${i.qty}</span></span>
                            <span>₹${getPrice(i.price) * i.qty}</span>
                        </div>
                    `).join('')}
                    ${order.tip > 0 ? `
                        <div class="flex justify-between text-[10px] font-bold text-green-600">
                            <span>Staff Tip ❤️</span>
                            <span>₹${order.tip}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between pt-2 border-t border-stone-100 items-center">
                        <span class="text-[10px] font-black text-stone-900 uppercase">Total Bill</span>
                        <span class="text-sm font-black text-primary">₹${order.total}</span>
                    </div>
                </div>

                ${isPayAfter ? `
                <div id="history-pay-${order.id}" class="mt-4 p-4 bg-white rounded-2xl border border-orange-100 shadow-sm animate-fade-in">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <span class="material-symbols-outlined">qr_code_2</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-stone-900 uppercase tracking-widest">Settle Bill Now</p>
                            <p class="text-[9px] font-bold text-stone-400">Scan to pay ₹${order.total}</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-center gap-4">
                        <div class="bg-stone-50 p-3 rounded-2xl border border-stone-100 w-full max-w-[160px]">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${order.total}&cu=INR&tn=KinaraOrder_${order.id}`)}" class="w-full aspect-square mix-blend-multiply opacity-80" alt="Payment QR">
                        </div>
                        
                        <div class="w-full space-y-2">
                            <button onclick="sharePaymentSS('${order.id}', ${order.total})" class="w-full bg-stone-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Share Payment SS</button>
                            <p class="text-[8px] text-stone-400 text-center font-bold">Please share screenshot on WhatsApp after payment</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function sharePaymentSS(orderId, amount) {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    let msg = `*PAYMENT VERIFICATION (DINE-IN) - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Amount:* ₹${amount}\n\n*Customer:* ${profile.name}\n\n_I have just paid the bill for my dine-in order. Sharing the screenshot below..._`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
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

    grid.innerHTML = items.length === 0 ? `<div class="col-span-full py-20 text-center text-stone-400 font-medium">No items found.</div>` : items.map((item, idx) => {
        const cartItem = cart.find(c => c.id === item.id);
        return `
            <div class="glass-card rounded-[24px] overflow-hidden flex flex-col h-full group transition-all hover:shadow-xl active:scale-95 duration-500 border border-white/20 animate-slide-up" style="animation-delay: ${idx * 0.05}s">
                <div class="relative aspect-square overflow-hidden bg-stone-50/30">
                    <img src="${item.image}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${item.name}">
                    <div class="absolute top-3 right-3 veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}"><div></div></div>
                </div>
                <div class="p-4 flex flex-col flex-1">
                    <h4 class="font-bold text-stone-800 text-[11px] uppercase tracking-tight leading-tight mb-3 line-clamp-2">${item.name}</h4>
                    <div class="mt-auto flex items-center justify-between gap-2">
                        <span class="font-black text-stone-900 text-sm">${isNaN(parseFloat(item.price)) ? item.price : '₹' + item.price}</span>
                        ${cartItem ? `
                            <div class="flex items-center gap-2.5 bg-stone-100 rounded-xl p-1 border border-stone-200/50">
                                <button onclick="changeQty('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center text-stone-900 font-bold bg-white rounded-lg shadow-sm active:scale-90 transition-all">−</button>
                                <span class="font-black text-primary text-[11px] w-4 text-center">${cartItem.qty}</span>
                                <button onclick="changeQty('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center text-white font-bold bg-primary rounded-lg shadow-sm active:scale-90 transition-all">+</button>
                            </div>
                        ` : `<button onclick="addToCart('${item.id}')" class="bg-stone-900 text-white px-5 py-2 rounded-xl font-black text-[9px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-stone-900/10">Add</button>`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCart(itemId) {
    let item;
    menuData.categories.forEach(cat => { const found = cat.items.find(i => i.id === itemId); if (found) item = found; });
    if (item) { cart.push({ ...item, qty: 1 }); updateCart(); showToast(`Added ${item.name}`); }
}

function changeQty(itemId, delta) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx > -1) { cart[idx].qty += delta; if (cart[idx].qty <= 0) cart.splice(idx, 1); updateCart(); }
}

function getPrice(price) { return isNaN(parseFloat(price)) ? 0 : parseFloat(price); }

function updateCart() {
    localStorage.setItem('kinara_cart', JSON.stringify(cart));
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const { itemTotal, deliveryFee, tip, grandTotal, distance } = calculateCartTotals();
    
    const badge = document.getElementById('cart-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count; badge.classList.remove('hidden');
            badge.classList.add('cart-pop'); setTimeout(() => badge.classList.remove('cart-pop'), 300);
        } else { badge.classList.add('hidden'); }
    }

    if (document.getElementById('cart-items-amt')) document.getElementById('cart-items-amt').textContent = `₹${itemTotal}`;
    if (document.getElementById('delivery-amt')) document.getElementById('delivery-amt').textContent = `₹${deliveryFee}`;
    if (document.getElementById('cart-total-amt')) document.getElementById('cart-total-amt').textContent = `₹${grandTotal}`;
    
    if (document.getElementById('delivery-label')) {
        if (userCoords) document.getElementById('delivery-label').textContent = `Delivery (${distance.toFixed(1)} KM)`;
        else document.getElementById('delivery-label').textContent = `Delivery Fee`;
    }
    
    renderCartItems();
    renderMenu();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list || !footer) return;
    
    if (cart.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center py-16 text-center animate-fade-in">
                <div class="w-32 h-32 bg-stone-50 rounded-full flex items-center justify-center mb-6 empty-cart-gradient">
                    <span class="material-symbols-outlined text-stone-200 text-5xl">shopping_basket</span>
                </div>
                <h3 class="text-sm font-black text-stone-900 uppercase tracking-widest mb-2">Your cart is empty</h3>
                <p class="text-[10px] font-bold text-stone-400 uppercase tracking-tight max-w-[200px] leading-relaxed">Looks like you haven't added any Malvani treasures yet.</p>
                <button onclick="closeCart()" class="mt-8 text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b-2 border-primary/20 pb-1">Start Exploring</button>
            </div>
        `;
        footer.classList.add('hidden');
        return;
    }
    
    footer.classList.remove('hidden');
    list.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center gap-5 bg-white p-4 rounded-[28px] border border-stone-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-stone-200/40 animate-slide-in" style="animation-delay: ${idx * 0.05}s">
            <div class="w-20 h-20 rounded-[20px] overflow-hidden shadow-sm border border-stone-50 bg-stone-50 relative flex-shrink-0">
                <img src="${item.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                <div class="absolute top-1.5 right-1.5 veg-indicator ${item.isVeg ? 'veg' : 'non-veg'} scale-75"><div></div></div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-[8px] font-black text-stone-300 uppercase tracking-[0.2em] mb-1">${item.categoryName || 'Main Course'}</p>
                <h5 class="font-black text-stone-900 text-[11px] uppercase tracking-tight line-clamp-1 mb-1">${item.name}</h5>
                <p class="text-primary font-black text-xs">₹${item.price}</p>
            </div>
            <div class="flex flex-col items-center gap-2 bg-stone-50 rounded-2xl p-1.5 border border-stone-100">
                <button onclick="changeQty('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                </button>
                <span class="font-black text-stone-900 text-xs w-5 text-center">${item.qty}</span>
                <button onclick="changeQty('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[18px]">remove</span>
                </button>
            </div>
        </div>
    `).join('');
}

function openCart() { document.getElementById('cart-modal').classList.add('open'); }
function closeCart() { document.getElementById('cart-modal').classList.remove('open'); }

function placeOrder() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (!profile.name || !profile.phone) { showToast('Complete profile first'); openProfile(); return; }
    
    const tableNum = document.getElementById('table-number')?.value;
    if (orderMode === 'DINE_IN' && !tableNum) { showToast('Please enter table number'); return; }

    const { itemTotal, deliveryFee, tip, grandTotal, distance } = calculateCartTotals();
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    
    const newOrder = { id: orderId, date: date, items: [...cart], total: grandTotal, method: paymentMethod, distance: distance, coords: userCoords, mode: orderMode, table: tableNum, tip: tip };
    orders.push(newOrder);
    localStorage.setItem('kinara_orders', JSON.stringify(orders));

    let msg = `*NEW ${orderMode === 'DINE_IN' ? 'DINE-IN' : 'DELIVERY'} ORDER - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Status:* ${paymentMethod === 'ONLINE' ? 'PAID ONLINE' : paymentMethod === 'DINE_PAY' ? 'PAY AFTER MEAL' : 'COD'}\n\n*Customer:* ${profile.name}\n*Phone:* ${profile.phone}\n`;
    
    if (orderMode === 'DINE_IN') {
        msg += `*TABLE NUMBER:* ${tableNum}\n*Type:* Dine-In (Eat First, Pay Later)\n`;
    } else {
        msg += `*Address:* ${profile.address}\n`;
        if (profile.coords) msg += `*Location:* https://www.google.com/maps?q=${profile.coords.lat},${profile.coords.lng}\n*Distance:* ${distance.toFixed(1)} KM\n`;
    }
    
    msg += `\n*ITEMS:*\n`;
    cart.forEach(item => { msg += `• ${item.name} x ${item.qty} = ₹${getPrice(item.price) * item.qty}\n`; });
    msg += `\n*Item Total:* ₹${itemTotal}\n`;
    if (orderMode === 'DELIVERY') msg += `*Delivery:* ₹${deliveryFee}\n`;
    if (tip > 0) msg += `*Staff Tip ❤️:* ₹${tip}\n`;
    msg += `*GRAND TOTAL: ₹${grandTotal}*`;
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    
    setTimeout(() => {
        cart = []; updateCart(); closeCart();
        if (orderMode === 'DELIVERY') openTracking(orderId);
        else showToast("Order sent to kitchen!");
    }, 1000);
}

function openTracking(orderId) {
    const order = orders.find(o => o.id == orderId);
    if (!order) return;
    
    document.getElementById('tracking-modal').classList.add('open');
    document.getElementById('track-dist').textContent = `${(order.distance || 0).toFixed(1)} KM`;
    document.getElementById('track-eta').textContent = `${Math.ceil((order.distance || 0) * 5 + 15)} Mins`;
    
    // Init Map with Cinematic Style
    setTimeout(() => {
        if (historyMap) { historyMap.remove(); historyMap = null; }
        historyMap = L.map('history-map', { zoomControl: false, attributionControl: false }).setView([HOTEL_COORDS.lat, HOTEL_COORDS.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(historyMap);
        
        const hotelIcon = L.icon({
            iconUrl: 'logo-main.png',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            className: 'map-logo-marker shadow-lg'
        });
        
        const userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#e23744; width:34px; height:34px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(226,55,68,0.3);"><span class="material-symbols-outlined" style="color:white; font-size:18px;">location_on</span></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        L.marker([HOTEL_COORDS.lat, HOTEL_COORDS.lng], { icon: hotelIcon }).addTo(historyMap).bindPopup('Kinara Seafood');
        
        if (order.coords) {
            L.marker([order.coords.lat, order.coords.lng], { icon: userIcon }).addTo(historyMap).bindPopup('Delivery Point');
            const line = L.polyline([[HOTEL_COORDS.lat, HOTEL_COORDS.lng], [order.coords.lat, order.coords.lng]], { 
                color: '#e23744', 
                weight: 6, 
                opacity: 0.6,
                lineCap: 'round',
                dashArray: '1, 12'
            }).addTo(historyMap);
            
            historyMap.fitBounds(line.getBounds(), { padding: [40, 40], animate: true, duration: 1.5 });
        }
        
        document.getElementById('history-map-loader').classList.add('hidden');
    }, 500);
}

function closeTracking() {
    document.getElementById('tracking-modal').classList.remove('open');
}

function openProfile() { document.getElementById('profile-modal').classList.add('open'); }
function closeProfile() { document.getElementById('profile-modal').classList.remove('open'); }

function detectLocation() {
    const btn = document.getElementById('detect-loc-btn');
    const status = document.getElementById('location-status');
    btn.innerHTML = `<span class="animate-spin material-symbols-outlined">sync</span> Capturing...`;
    
    if (!navigator.geolocation) { showToast("Not supported"); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        status.classList.remove('hidden');
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> Location Pin Saved`;
        btn.classList.replace('bg-white', 'bg-green-50');
        btn.classList.replace('text-stone-600', 'text-green-600');
        updateCart(); showToast("House location pinned!");
    }, () => { showToast("Allow access to pin house"); }, { enableHighAccuracy: true });
}

function saveProfile() {
    const profile = { name: document.getElementById('prof-name').value, email: document.getElementById('prof-email').value, phone: document.getElementById('prof-phone').value, address: document.getElementById('prof-addr').value, coords: userCoords };
    if (!profile.name || !profile.phone) { showToast('Missing fields'); return; }
    localStorage.setItem('kinara_profile', JSON.stringify(profile));
    showToast('Profile saved'); closeProfile(); updateCart();
}

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (profile.name) { 
        document.getElementById('prof-name').value = profile.name;
        document.getElementById('prof-email').value = profile.email;
        document.getElementById('prof-phone').value = profile.phone;
        document.getElementById('prof-addr').value = profile.address;
        if(profile.coords) { userCoords = profile.coords; document.getElementById('location-status').classList.remove('hidden'); }
    }
}

function showToast(text) {
    const toast = document.getElementById('toast'); if(!toast) return;
    toast.textContent = text; toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 0)'; }, 3000);
}

function closeStatus() {}
function confirmOnlinePayment() {}
