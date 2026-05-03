const UPI_ID = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_ID : 'tabsaiyyad@oksbi';
const UPI_NAME = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.UPI_NAME : 'Kinara Sea Food';
const WA_NUMBER = typeof KINARA_CONFIG !== 'undefined' ? KINARA_CONFIG.WA_NUMBER : '917045528239';
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJvfrOGBPD5zsRn4_OU6KH7do";

const HOTEL_COORDS = { lat: 19.033, lng: 73.016 }; // Nerul Sector 20
const DELIVERY_RATE = 20; // Rs per KM after 1km free
const COOKING_TIME = 18; // Base prep time in mins (Adjusted for 20-25min total for 0.5-1km)
const TRAVEL_SPEED = 7;  // Mins per KM (city traffic)

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
let userCoords = null;
let trackingInterval = null;

// Initialize the app
function init() {
    try {
        console.log("Kinara App Initializing v2.6...");
        loadProfile();
        renderCategories();
        renderMenu();
        renderOrdersHistory();
        updateCartBadge();
        updateShopStatus();
        
        // Update shop status every minute
        setInterval(updateShopStatus, 60000);
        
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
        window.markDelivered = markDelivered;
        window.openGoogleReview = openGoogleReview;
        window.closeDeliveredOverlay = closeDeliveredOverlay;
        window.sharePaymentSS = sharePaymentSS;
        window.confirmDineinPaid = confirmDineinPaid;
        
        // Start live tracker
        startLiveStatusTracker();
        console.log("Kinara App Initialized Successfully.");
    } catch (e) {
        console.error("Kinara Init Error:", e);
        // Show error on screen for debugging if needed
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = "Init Error: " + e.message;
            toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        }
    }
}

function updateShopStatus() {
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const timeVal = hrs + mins / 60;

    const openTime = 11; // 11 AM
    const closeTime = 23.5; // 11:30 PM

    const statusPill = document.getElementById('dynamic-status-pill');
    const statusText = document.getElementById('dynamic-status-text');
    const headerShopDot = document.getElementById('header-shop-dot');
    const headerShopText = document.getElementById('header-shop-text');

    if (timeVal >= openTime && timeVal < closeTime) {
        const remaining = closeTime - timeVal;
        const h = Math.floor(remaining);
        const m = Math.round((remaining - h) * 60);
        
        const label = `Open now (closes in ${h}h ${m}m)`;
        
        if (statusText) statusText.textContent = label;
        if (statusPill) {
            statusPill.className = "flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-md";
            const dot = statusPill.querySelector('div');
            if (dot) dot.className = "w-1 h-1 rounded-full bg-green-500 animate-pulse";
        }
        
        if (headerShopDot) {
            headerShopDot.className = "w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse";
        }
        if (headerShopText) {
            headerShopText.textContent = "OPEN";
            headerShopText.className = "text-[7px] font-black text-green-600 uppercase tracking-tighter";
        }
    } else {
        const label = `Closed (opens at 11 AM)`;
        if (statusText) statusText.textContent = label;
        if (statusPill) {
            statusPill.className = "flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-md";
            const dot = statusPill.querySelector('div');
            if (dot) dot.className = "w-1 h-1 rounded-full bg-red-500";
        }
        
        if (headerShopDot) {
            headerShopDot.className = "w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]";
        }
        if (headerShopText) {
            headerShopText.textContent = "CLOSED";
            headerShopText.className = "text-[7px] font-black text-red-600 uppercase tracking-tighter";
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function switchTab(tab) {
    const homeBtn = document.getElementById('nav-home');
    const ordersBtn = document.getElementById('nav-orders');
    
    // Reset all states
    [homeBtn, ordersBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.replace('text-red-500', 'text-stone-400');
        btn.querySelector('.bg-red-500')?.classList.replace('opacity-100', 'opacity-0');
    });

    if (tab === 'home' && homeBtn) {
        closeCart();
        closeOrders();
        closeProfile();
        scrollToTop();
        homeBtn.classList.replace('text-stone-400', 'text-red-500');
        homeBtn.querySelector('.bg-red-500')?.classList.replace('opacity-0', 'opacity-100');
    } else if (tab === 'orders' && ordersBtn) {
        openOrders();
        ordersBtn.classList.replace('text-stone-400', 'text-red-500');
        ordersBtn.querySelector('.bg-red-500')?.classList.replace('opacity-0', 'opacity-100');
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
    const dineFields = document.getElementById('dine-in-fields');
    const dinePayBtn = document.getElementById('pay-method-dine');
    const codBtn = document.getElementById('pay-method-cod');
    const cashBtn = document.getElementById('pay-method-cash');
    const homeSeating = document.getElementById('home-seating-container');

    if (mode === 'DELIVERY') {
        delBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        delBtn.classList.remove('text-stone-400');
        dineBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        dineBtn.classList.add('text-stone-400');
        
        if (homeSeating) homeSeating.classList.add('hidden');
        dineFields.classList.add('hidden');
        
        dinePayBtn.classList.add('hidden');
        codBtn.classList.remove('hidden');
        if (cashBtn) cashBtn.classList.remove('hidden');
        
        setPaymentMethod('COD');
    } else {
        dineBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        dineBtn.classList.remove('text-stone-400');
        delBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        delBtn.classList.add('text-stone-400');
        
        if (homeSeating) homeSeating.classList.remove('hidden');
        dineFields.classList.remove('hidden');
        
        dinePayBtn.classList.remove('hidden');
        codBtn.classList.add('hidden');
        if (cashBtn) cashBtn.classList.remove('hidden');
        
        setPaymentMethod('DINE_PAY');
        renderTableGrids();
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
    
    const display = document.getElementById('tip-amt-display');
    if (display) display.textContent = `₹${amount}`;
    updateCart();
}

function toggleVegOnly() {
    isVegOnly = !isVegOnly;
    const chip = document.getElementById('veg-chip');
    const dot = document.getElementById('veg-chip-dot');
    
    if (isVegOnly) {
        chip.classList.replace('veg-chip-inactive', 'veg-chip-active');
        if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse";
        showToast("🌱 Pure Veg Menu Active");
    } else {
        chip.classList.replace('veg-chip-active', 'veg-chip-inactive');
        if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-stone-300";
    }
    renderMenu();
}

function setPaymentMethod(method) {
    paymentMethod = method;
    const codBtn = document.getElementById('pay-method-cod');
    const upiBtn = document.getElementById('pay-method-upi');
    const scanBtn = document.getElementById('pay-method-scan');
    const dineBtn = document.getElementById('pay-method-dine');
    const cashBtn = document.getElementById('pay-method-cash');
    
    const placeBtn = document.getElementById('place-order-btn');
    const paymentSection = document.getElementById('payment-section');

    // Reset all
    [codBtn, upiBtn, dineBtn, scanBtn, cashBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('border-primary', 'bg-white', 'shadow-sm', 'opacity-100');
        btn.classList.add('border-stone-100', 'bg-stone-50/50', 'opacity-60');
        const icon = btn.querySelector('.material-symbols-outlined');
        const label = btn.querySelector('span:not(.material-symbols-outlined)');
        if (icon) { icon.classList.remove('text-primary'); icon.classList.add('text-stone-400'); }
        if (label) { label.classList.remove('text-stone-900'); label.classList.add('text-stone-400'); }
    });

    const activeBtn = method === 'COD' ? codBtn : 
                      method === 'CASH' ? cashBtn :
                      method === 'DINE_PAY' ? dineBtn : 
                      method === 'UPI' ? upiBtn : scanBtn;

    if (activeBtn) {
        activeBtn.classList.add('border-primary', 'bg-white', 'shadow-sm', 'opacity-100');
        activeBtn.classList.remove('border-stone-100', 'bg-stone-50/50', 'opacity-60');
        const icon = activeBtn.querySelector('.material-symbols-outlined');
        const label = activeBtn.querySelector('span:not(.material-symbols-outlined)');
        if (icon) { icon.classList.remove('text-stone-400'); icon.classList.add('text-primary'); }
        if (label) { label.classList.remove('text-stone-400'); label.classList.add('text-stone-900'); }
    }

    // Handle Special Sections
    const qrImg = document.getElementById('upi-qr');
    const upiIdDisplay = document.getElementById('upi-id-display');

    if (method === 'SCAN') {
        const { grandTotal } = calculateCartTotals();
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${grandTotal}&cu=INR&tn=KinaraOrder`;
        // Always generate dynamic QR with specific amount for a professional experience
        if (qrImg) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=222222&margin=20`;
        }
        if (upiIdDisplay) upiIdDisplay.textContent = UPI_ID;
        
        if (paymentSection) paymentSection.classList.remove('hidden');
        if (placeBtn) placeBtn.classList.add('hidden');
    } else {
        if (paymentSection) paymentSection.classList.add('hidden');
        if (placeBtn) placeBtn.classList.remove('hidden');
    }

    if (placeBtn) {
        if (method === 'UPI') {
            placeBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">smartphone</span> PAY & PLACE ORDER`;
            placeBtn.classList.replace('bg-stone-900', 'bg-primary');
        } else {
            placeBtn.innerHTML = `PLACE ORDER`;
            placeBtn.classList.replace('bg-primary', 'bg-stone-900');
        }
    }
}

function sharePaymentScreenshot() {
    const { grandTotal } = calculateCartTotals();
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const shopDisplayPhone = '+91 70455 28239';
    
    const msg = encodeURIComponent(`*PAYMENT VERIFICATION - KINARA SEAFOOD*\nI am sending the payment screenshot for my order.\n\n*Amount:* ₹${grandTotal}\n*Customer:* ${profile.name || 'Customer'}\n*Ref:* #${orderId}\n\n_Shop Contact: ${shopDisplayPhone}_`);
    const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    
    window.open(whatsappUrl, '_blank');
    showToast('Please share screenshot on WhatsApp');
}

function confirmOnlinePayment() {
    // This is called when user clicks "Confirm Paid" in Scan QR mode
    placeOrder();
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
    const shopDisplayPhone = '+91 70455 28239';
    
    let msg = `*PAYMENT VERIFICATION - KINARA SEA FOOD*\n*Ref ID:* #${orderId}\n*Status:* PAYING ONLINE\n\n*Customer:* ${profile.name}\n\n*ITEMS:*\n`;
    cart.forEach(item => { msg += `• ${item.name} x ${item.qty}\n`; });
    msg += `\n*TOTAL: ₹${grandTotal}*\n\n_Shop Contact: ${shopDisplayPhone}_\n_I am sharing the payment screenshot now..._`;
    
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
        list.innerHTML = `<div class="py-16 text-center text-stone-400">
            <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-stone-200 text-4xl">history</span>
            </div>
            <p class="text-xs font-black uppercase tracking-widest">No past orders found</p>
        </div>`;
        return;
    }
    list.innerHTML = [...orders].reverse().map(order => {
        const isDineIn = order.mode === 'DINE_IN';
        const isPayAfter = order.method === 'DINE_PAY';
        const isDeliveryOrder = !isDineIn;
        const isDelivered = order.delivered === true;
        
        // Status Semantics
        let statusLabel = 'Processing';
        let statusClass = 'bg-stone-50 text-stone-500 border-stone-200';
        
        if (order.paid) {
            statusLabel = isDineIn ? 'Bill Paid \u2713' : 'Paid \u2713';
            statusClass = 'bg-green-50 text-green-600 border-green-100';
        } else if (order.method === 'COD') {
            statusLabel = 'Cash on Delivery';
            statusClass = 'bg-amber-50 text-amber-600 border-amber-100';
        } else if (isPayAfter) {
            statusLabel = 'Pay After Meal';
            statusClass = 'bg-orange-50 text-orange-600 border-orange-100';
        } else if (order.method === 'ONLINE') {
            statusLabel = 'Paid Online';
            statusClass = 'bg-green-50 text-green-600 border-green-100';
        }

        return `
            <div class="bg-white rounded-[32px] p-6 border border-stone-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:scale-[1.01] transition-all duration-300 animate-slide-up mb-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="space-y-0.5">
                        <p class="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em] opacity-60">#${order.id} &middot; ${order.date}</p>
                        ${isDineIn ? `<p class="text-[10px] font-black text-primary uppercase tracking-widest">Table ${order.table}</p>` : ''}
                    </div>
                    <div class="${statusClass} px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm">
                        ${statusLabel}
                    </div>
                </div>
                
                <div class="space-y-4 mb-6">
                    ${order.items.map(i => `
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-lg border border-stone-100/50 shadow-inner flex-shrink-0">
                                ${i.category === 'Non-Veg' ? '\uD83C\uDF64' : '\uD83E\uDDC8'}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-extrabold text-stone-900 truncate tracking-tight">${i.name}</p>
                                <p class="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty: ${i.qty}</p>
                            </div>
                            <p class="text-sm font-black text-stone-950 tabular-nums">\u20b9${getPrice(i.price) * i.qty}</p>
                        </div>
                    `).join('')}
                    
                    ${order.tip > 0 ? `
                        <div class="flex items-center justify-between py-2 border-y border-stone-50 border-dashed">
                            <p class="text-[10px] font-black text-green-600 uppercase tracking-widest">Staff Tip \u2764\ufe0f</p>
                            <p class="text-[10px] font-black text-green-600">\u20b9${order.tip}</p>
                        </div>
                    ` : ''}

                    <div class="flex justify-between items-center pt-3 border-t border-stone-100">
                        <span class="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Total Bill</span>
                        <span class="text-lg font-black text-stone-900 tracking-tighter">\u20b9${order.total}</span>
                    </div>
                </div>

                <div class="flex gap-3">
                    ${isDeliveryOrder && !isDelivered ? `
                        <button onclick="openTracking('${order.id}')" class="flex-1 bg-stone-50 text-stone-900 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex justify-center items-center gap-2 border border-stone-100 active:scale-95 transition-all">
                            <span class="material-symbols-outlined text-[16px]">my_location</span> Track Order
                        </button>
                        <button onclick="markDelivered('${order.id}')" class="flex-1 bg-green-600 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-600/20">
                            <span class="material-symbols-outlined text-[16px]">check_circle</span> Delivered
                        </button>
                    ` : isDeliveryOrder && isDelivered ? `
                        <div class="w-full flex items-center justify-center gap-2 py-3 bg-green-50 rounded-2xl border border-green-100">
                             <span class="material-symbols-outlined text-[16px] text-green-600">verified</span>
                             <span class="text-[9px] font-black text-green-600 uppercase tracking-widest">Order Completed</span>
                        </div>
                    ` : ''}
                </div>

                ${isPayAfter && !order.paid ? `
                <div id="history-pay-${order.id}" class="mt-6 bg-stone-50 rounded-2xl border border-stone-100 overflow-hidden shadow-inner animate-fade-in p-4">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-stone-100">
                            <span class="material-symbols-outlined text-[20px]">qr_code_2</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-stone-900 uppercase tracking-widest">Settle Bill</p>
                            <p class="text-[9px] font-bold text-stone-400">Scan to pay \u20b9${order.total}</p>
                        </div>
                    </div>

                    <!-- Instruction Steps -->
                    <div class="px-4 pt-3 pb-1">
                        <p class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] text-center">
                            1&nbsp; Scan &amp; Pay &nbsp;&bull;&nbsp; 2&nbsp; Share SS on WhatsApp &nbsp;&bull;&nbsp; 3&nbsp; Tap Bill Paid
                        </p>
                    </div>

                    <!-- QR Code -->
                    <div class="flex justify-center px-4 py-3">
                        <div class="bg-stone-50 p-3 rounded-2xl border border-stone-100 inline-block">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${order.total}&cu=INR&tn=KinaraOrder_${order.id}`)}" class="w-36 h-36 mix-blend-multiply opacity-90 block" alt="Payment QR">
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="px-4 pb-4 space-y-2">
                        <!-- Secondary: Share Screenshot -->
                        <button onclick="sharePaymentSS('${order.id}', ${order.total})" class="w-full border border-stone-200 bg-stone-50 text-stone-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                            <svg class="w-3.5 h-3.5 fill-current text-green-600" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Share Screenshot on WhatsApp
                        </button>

                        <!-- Primary: BILL PAID -->
                        <button id="bill-paid-btn-${order.id}" onclick="confirmDineinPaid('${order.id}')" class="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-lg">
                            <span class="material-symbols-outlined text-[20px]">payments</span>
                            Bill Paid
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Mark delivery order as received — shows celebration + review prompt
function markDelivered(orderId) {
    const idx = orders.findIndex(o => o.id == orderId);
    if (idx === -1) return;
    orders[idx].delivered = true;
    orders[idx].paid = true; // Mark as paid upon receipt
    localStorage.setItem('kinara_orders', JSON.stringify(orders));
    renderOrdersHistory();
    closeOrders();
    showThankYouOverlay(false); // delivery context
}

function openGoogleReview() {
    window.open(GOOGLE_REVIEW_URL, '_blank');
    closeDeliveredOverlay();
}

function closeDeliveredOverlay() {
    const overlay = document.getElementById('delivered-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }
    // Always go back to home after Thank You screen
    setTimeout(() => switchTab('home'), 300);
}

// Shared Thank You overlay — works for both delivery (isDineIn=false) and dine-in (isDineIn=true)
function showThankYouOverlay(isDineIn) {
    const overlay = document.getElementById('delivered-overlay');
    if (!overlay) return;

    // Dynamically update heading & subtitle based on context
    const heading = overlay.querySelector('#overlay-heading');
    const subtitle = overlay.querySelector('#overlay-subtitle');
    const icon = overlay.querySelector('#overlay-icon');

    if (isDineIn) {
        if (heading)  heading.textContent = 'THANKS FOR DINING! \uD83D\uDE4F';
        if (subtitle) subtitle.textContent = 'HOPE YOU LOVED YOUR MALVANI FEAST!';
        if (icon)     icon.textContent = 'restaurant';
    } else {
        if (heading)  heading.textContent = 'ORDER DELIVERED! \uD83C\uDF89';
        if (subtitle) subtitle.textContent = 'THANK YOU FOR CHOOSING KINARA SEAFOOD';
        if (icon)     icon.textContent = 'verified';
    }

    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
}

function sharePaymentSS(orderId, amount) {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    const shopDisplayPhone = '+91 70455 28239';
    let msg = `*PAYMENT VERIFICATION (DINE-IN) - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Amount:* \u20b9${amount}\n\n*Customer:* ${profile.name}\n\n_Shop Contact: ${shopDisplayPhone}_\n_I have just paid the bill for my dine-in order. Sharing the screenshot below..._`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    // No auto overlay — user confirms manually via BILL PAID button
}

// Dine-In: customer taps BILL PAID — button turns green → Thank You overlay
function confirmDineinPaid(orderId) {
    const idx = orders.findIndex(o => o.id == orderId);
    if (idx !== -1) {
        orders[idx].paid = true;
        localStorage.setItem('kinara_orders', JSON.stringify(orders));
        
        // Refresh grids to release table
        renderTableGrids();
        renderOrdersHistory();
    }

    const btn = document.getElementById(`bill-paid-btn-${orderId}`);
    if (btn) {
        btn.disabled = true;
        btn.classList.remove('bg-stone-900', 'shadow-lg');
        btn.classList.add('bg-green-600', 'shadow-green-600/20');
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span> Bill Paid \u2713';
        
        setTimeout(() => {
            showThankYouOverlay(true);
        }, 800);
    }
}


// Live Time & Shop Status Tracker
function startLiveStatusTracker() {
    console.log("Starting Live Status Tracker...");
    function update() {
        const now = new Date();
        const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' });
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const hours = now.getHours();
        const mins = now.getMinutes();
        const secs = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
        const displayMins = mins.toString().padStart(2, '0');
        const timeStr = `${displayHours}:${displayMins}`;

        // Shop Hours: 11:30 AM to 11:30 PM
        const currentTotalMins = (hours * 60) + mins;
        const openMins = (11 * 60) + 30;
        const closeMins = (23 * 60) + 30;
        const isOpen = currentTotalMins >= openMins && currentTotalMins <= closeMins;

        const updateEl = (prefix) => {
            const dayEl = document.getElementById(`${prefix}live-day`);
            const dateEl = document.getElementById(`${prefix}live-date`);
            const timeEl = document.getElementById(`${prefix}live-time`);
            const ampmEl = document.getElementById(`${prefix}live-ampm`);
            const secEl = document.getElementById(`${prefix}live-sec`);
            const dotEl = document.getElementById(`${prefix}shop-dot`);
            const textEl = document.getElementById(`${prefix}shop-text`);
            
            if (dayEl) dayEl.textContent = dayName;
            if (dateEl) dateEl.textContent = dateStr;
            if (timeEl) timeEl.textContent = timeStr;
            if (ampmEl) ampmEl.textContent = ampm;
            if (secEl) secEl.textContent = secs;

            if (dotEl && textEl) {
                if (isOpen) {
                    dotEl.className = 'w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse';
                    textEl.textContent = 'OPEN';
                    textEl.className = 'text-[7px] font-black text-green-600 uppercase tracking-tighter';
                } else {
                    dotEl.className = 'w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]';
                    textEl.textContent = 'CLOSED';
                    textEl.className = 'text-[7px] font-black text-red-600 uppercase tracking-tighter';
                }
            }
        };

        updateEl(''); // Tracking modal
        updateEl('header-'); // Header
    }
    update();
    setInterval(update, 1000);
}

function renderCategories() {
    const row = document.getElementById('cat-row');
    if (!row) return;

    row.classList.add('category-scroll-container');

    const cats = ['All', ...menuData.categories.map(c => c.name)];
    row.innerHTML = cats.map(cat => {
        const isActive = cat === currentCategory;
        const btnClass = isActive ? 'active-category' : 'inactive-category';
        return `
            <button onclick="setCat('${cat}')" 
                class="category-btn whitespace-nowrap px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${btnClass}">
                ${cat}
            </button>
        `;
    }).join('');
}

function setCat(cat) {
    currentCategory = cat;
    renderCategories();
    renderMenu();
}

// FIX: Single unified filterMenu with debounce AND banner update
let searchTimer;
function filterMenu() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
        const banner = document.getElementById('search-banner');
        if (searchQuery) {
            banner.classList.remove('hidden');
            document.getElementById('search-banner-text').textContent = `Searching for "${searchQuery}"`;
        } else {
            banner.classList.add('hidden');
        }
        renderMenu();
    }, 300);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    filterMenu();
}

let cachedMenuItems = null;
function getFlattenedMenu() {
    if (cachedMenuItems) return cachedMenuItems;
    cachedMenuItems = [];
    menuData.categories.forEach(cat => {
        cat.items.forEach(item => {
            cachedMenuItems.push({ ...item, categoryName: cat.name });
        });
    });
    return cachedMenuItems;
}

function renderMenu() {
    try {
        const grid = document.getElementById('menu-grid');
        if (!grid) {
            console.error("Menu grid element not found!");
            return;
        }
        
        const allItems = getFlattenedMenu();
        console.log(`Rendering menu: ${allItems.length} items found.`);
        
        let filteredItems = allItems;

        if (currentCategory !== 'All') filteredItems = filteredItems.filter(i => i.categoryName === currentCategory);
        if (isVegOnly) filteredItems = filteredItems.filter(i => i.isVeg === true);
        if (searchQuery) filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(searchQuery));

        const cartMap = new Map();
        cart.forEach(c => cartMap.set(c.id, c.qty));

        if (filteredItems.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center text-stone-400 font-medium animate-fade-in">No items found matching your filter.</div>`;
            return;
        }

        // If 'All' is selected, we group by category to provide the "headings" requested
        if (currentCategory === 'All' && !searchQuery) {
            let html = '';
            menuData.categories.forEach(cat => {
                const catItems = filteredItems.filter(i => i.categoryName === cat.name);
                if (catItems.length > 0) {
                    html += `
                        <div class="col-span-full mt-8 mb-4 px-1 animate-slide-up">
                            <div class="flex items-center gap-4">
                                <h3 class="text-[10px] font-black text-stone-900 uppercase tracking-[0.4em] whitespace-nowrap">
                                    ${cat.name}
                                </h3>
                                <div class="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent"></div>
                            </div>
                        </div>
                    `;
                    html += catItems.map((item, idx) => renderMenuItem(item, idx, cartMap)).join('');
                }
            });
            grid.innerHTML = html;
        } else {
            grid.innerHTML = filteredItems.map((item, idx) => renderMenuItem(item, idx, cartMap)).join('');
        }
    } catch (e) {
        console.error("Error in renderMenu:", e);
    }
}

function renderMenuItem(item, idx, cartMap) {
    const qty = cartMap.get(item.id);
    
    // Simulate "Delicious Triggers"
    const isBestseller = item.price > 300 || idx % 5 === 0;
    const isSpicy = item.name.toLowerCase().includes('garlic') || item.name.toLowerCase().includes('fry');
    const isSpecial = idx === 0 || idx === 3;
    const rating = (4.2 + Math.random() * 0.7).toFixed(1);

    return `
        <div class="glass-card rounded-[32px] overflow-hidden flex flex-col h-full group transition-all hover:shadow-2xl active:scale-95 duration-500 border border-white/20 animate-slide-up mb-2" data-item-id="${item.id}" style="animation-delay: ${idx * 0.01}s">
            <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
                <img src="${item.image}" loading="lazy" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="${item.name}">
                
                <!-- Gradient Overlay -->
                <div class="absolute inset-0 food-card-overlay opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <!-- Top Tags -->
                <div class="absolute top-3 left-3 flex flex-col gap-2">
                    ${isBestseller ? `
                        <div class="tag-pill bg-amber-500 text-white px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                            <span class="material-symbols-outlined text-[12px]">local_fire_department</span> Bestseller
                        </div>` : ''}
                    ${isSpecial ? `
                        <div class="tag-pill bg-indigo-600 text-white px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">auto_awesome</span> Chef's Special
                        </div>` : ''}
                </div>

                <div class="absolute top-3 right-3 flex flex-col items-end gap-2">
                    <div class="veg-indicator ${item.isVeg ? 'veg' : 'non-veg'} bg-white/90 p-1 rounded-lg shadow-sm"><div></div></div>
                    ${isSpicy ? `<div class="bg-white/90 w-7 h-7 flex items-center justify-center rounded-lg shadow-sm text-[14px]">🌶️</div>` : ''}
                </div>

                <!-- Bottom Info Overlay -->
                <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div class="space-y-1">
                        <div class="flex items-center gap-1 text-white">
                            <span class="material-symbols-outlined text-amber-400 text-[14px] fill-current">star</span>
                            <span class="text-[10px] font-black">${rating}</span>
                        </div>
                        <div class="flex items-center gap-1 text-white/80">
                            <span class="material-symbols-outlined text-[12px]">schedule</span>
                            <span class="text-[8px] font-bold uppercase tracking-widest">15-20 Mins</span>
                        </div>
                    </div>
                    <div class="bg-white px-3 py-1.5 rounded-2xl shadow-xl">
                        <p class="text-[12px] font-black text-stone-900 tracking-tighter">₹${item.price}</p>
                    </div>
                </div>
            </div>

            <div class="p-5 flex flex-col flex-1 bg-white">
                <h4 class="font-extrabold text-stone-900 text-[13px] tracking-tight leading-tight mb-4 line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">${item.name}</h4>
                
                <div class="mt-auto flex items-center justify-between">
                    <div class="item-btn-area flex-1">
                        ${qty > 0 ? `
                            <div class="flex items-center gap-3 bg-stone-50 rounded-2xl p-1.5 border border-stone-100">
                                <button onclick="changeQty('${item.id}', -1)" class="w-8 h-8 flex items-center justify-center text-stone-900 font-bold bg-white rounded-xl shadow-sm active:scale-90 transition-all">−</button>
                                <span class="font-black text-primary text-[13px] w-6 text-center">${qty}</span>
                                <button onclick="changeQty('${item.id}', 1)" class="w-8 h-8 flex items-center justify-center text-white font-bold bg-primary rounded-xl shadow-sm active:scale-90 transition-all">+</button>
                            </div>
                        ` : `
                            <button onclick="addToCart('${item.id}')" class="w-full bg-stone-950 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-stone-950/10">
                                <span class="material-symbols-outlined text-[16px] group-hover/btn:rotate-90 transition-transform">add</span>
                                Add to Feast
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addToCart(itemId) {
    // FIX: use flat cache O(1) instead of nested category search
    const item = getFlattenedMenu().find(i => i.id === itemId);
    if (!item) return;
    const existing = cart.find(c => c.id === itemId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCart(itemId);
    showToast(`Added ${item.name}`);
}

function changeQty(itemId, delta) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx > -1) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    updateCart(itemId);
}

function getPrice(price) { return isNaN(parseFloat(price)) ? 0 : parseFloat(price); }

// FIX: updateCart now accepts an optional itemId to surgically update only that card's button
// This eliminates the full menu re-render on every cart change — the main source of mobile lag
function updateCart(itemId) {
    localStorage.setItem('kinara_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    
    if (itemId !== undefined) {
        updateMenuItemButton(itemId);
    } else {
        // NEW: If no specific itemId, reset all buttons (e.g., after order placement)
        document.querySelectorAll('[data-item-id]').forEach(card => {
            updateMenuItemButton(card.getAttribute('data-item-id'));
        });
    }
}

function updateCartBadge() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const { itemTotal, deliveryFee, grandTotal, distance } = calculateCartTotals();

    const badge = document.getElementById('cart-badge-pill');
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

    const itemsAmt = document.getElementById('cart-items-amt');
    const deliveryAmt = document.getElementById('delivery-amt');
    const totalAmt = document.getElementById('cart-total-amt');
    const deliveryLabel = document.getElementById('delivery-label');

    if (itemsAmt) itemsAmt.textContent = `₹${itemTotal}`;
    if (deliveryAmt) deliveryAmt.textContent = `₹${deliveryFee}`;
    if (totalAmt) totalAmt.textContent = `₹${grandTotal}`;
    if (deliveryLabel) {
        deliveryLabel.textContent = userCoords ? `Delivery (${distance.toFixed(1)} KM)` : `Delivery Fee`;
    }
}

// FIX: surgically updates only one menu card's add/qty button without re-rendering the grid
function updateMenuItemButton(itemId) {
    const cartEntry = cart.find(c => c.id === itemId);
    const qty = cartEntry ? cartEntry.qty : 0;

    // Find the button/control in the menu grid by data attribute
    const card = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!card) return;

    const btnArea = card.querySelector('.item-btn-area');
    if (!btnArea) return;

    if (qty > 0) {
        btnArea.innerHTML = `
            <div class="flex items-center gap-2 bg-stone-100/80 rounded-xl p-1 border border-stone-200/30 backdrop-blur-sm">
                <button onclick="changeQty('${itemId}', -1)" class="w-6 h-6 flex items-center justify-center text-stone-900 font-bold bg-white rounded-lg shadow-sm active:scale-90 transition-all text-xs">−</button>
                <span class="font-black text-primary text-[11px] w-4 text-center">${qty}</span>
                <button onclick="changeQty('${itemId}', 1)" class="w-6 h-6 flex items-center justify-center text-white font-bold bg-primary rounded-lg shadow-sm active:scale-90 transition-all text-xs">+</button>
            </div>`;
    } else {
        btnArea.innerHTML = `<button onclick="addToCart('${itemId}')" class="bg-stone-900 text-white px-4 py-2 rounded-xl font-black text-[9px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-stone-900/10">Add</button>`;
    }
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

function openCart() { 
    renderCartItems();
    renderTableGrids();
    updateCartBadge();
    document.getElementById('cart-modal').classList.add('open'); 
}
function closeCart() { document.getElementById('cart-modal').classList.remove('open'); }

function placeOrder() {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    if (!profile.name || !profile.phone) { showToast('Complete profile first'); openProfile(); return; }
    
    const tableNum = document.getElementById('table-number')?.value;
    if (orderMode === 'DINE_IN' && !tableNum) { showToast('Please enter table number'); return; }

    const { itemTotal, deliveryFee, tip, grandTotal, distance } = calculateCartTotals();
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    
    const note = document.getElementById('order-note')?.value;
    const newOrder = { 
        id: orderId, 
        date: date, 
        timestamp: Date.now(),
        items: [...cart], 
        total: grandTotal, 
        method: paymentMethod, 
        distance: distance, 
        coords: userCoords, 
        mode: orderMode, 
        table: tableNum, 
        tip: tip, 
        note: note 
    };
    orders.push(newOrder);
    localStorage.setItem('kinara_orders', JSON.stringify(orders));

    let statusText = 'COD';
    if (paymentMethod === 'CASH') statusText = 'CASH (IN-PERSON)';
    if (paymentMethod === 'UPI' || paymentMethod === 'SCAN') statusText = 'UPI/SCAN PAY';
    if (paymentMethod === 'DINE_PAY') statusText = 'EAT & PAY (AFTER MEAL)';

    let msg = `*NEW ${orderMode === 'DINE_IN' ? 'DINE-IN' : 'DELIVERY'} ORDER - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Status:* ${statusText}\n\n*Customer:* ${profile.name}\n*Phone:* ${profile.phone}\n`;
    
    if (orderMode === 'DINE_IN') {
        msg += `*TABLE NUMBER:* ${tableNum}\n*Type:* Dine-In (Eat First, Pay Later)\n`;
    } else {
        msg += `*Address:* ${profile.address}\n`;
        if (profile.coords) msg += `*Location:* https://www.google.com/maps?q=${profile.coords.lat},${profile.coords.lng}\n*Distance:* ${distance.toFixed(1)} KM\n`;
    }

    if (note) msg += `\n*SPECIAL NOTE:* ${note}\n`;
    
    msg += `\n*ITEMS:*\n`;
    cart.forEach(item => { msg += `• ${item.name} x ${item.qty} = ₹${getPrice(item.price) * item.qty}\n`; });
    msg += `\n*Item Total:* ₹${itemTotal}\n`;
    if (orderMode === 'DELIVERY') msg += `*Delivery:* ₹${deliveryFee}\n`;
    if (tip > 0) msg += `*Staff Tip ❤️:* ₹${tip}\n`;
    msg += `*GRAND TOTAL: ₹${grandTotal}*`;
    
    if (paymentMethod === 'UPI') {
        initiateUPIPayment(grandTotal, orderId);
    }
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    
    setTimeout(() => {
        cart = []; 
        updateCart(); 
        closeCart();
        
        // Reset selections
        const tableInput = document.getElementById('table-number');
        const resTableInput = document.getElementById('res-selected-table');
        const noteInput = document.getElementById('order-note');
        if (tableInput) tableInput.value = '';
        if (resTableInput) resTableInput.value = '[]';
        if (noteInput) noteInput.value = '';
        
        // Reset order mode to default
        updateOrderMode('DELIVERY');
        
        switchTab('orders');
        renderOrdersHistory();
        renderTableGrids();
        
        if (paymentMethod === 'UPI') showToast("Complete payment, then click BILL PAID.");
        if (paymentMethod === 'SCAN') showToast("Order sent! Complete scan payment now.");
    }, 1500);
}

function openTracking(orderId) {
    const order = orders.find(o => o.id == orderId);
    if (!order) return;
    
    document.getElementById('tracking-modal').classList.add('open');
    document.getElementById('track-dist').textContent = `${(order.distance || 0).toFixed(1)} KM`;
    
    // Start Live Tracking Logic
    startTrackingTimer(order);

    // Doorstep QR Logic
    const qrSection = document.getElementById('doorstep-qr-section');
    const qrImg = document.getElementById('doorstep-qr-img');
    const qrAmt = document.getElementById('doorstep-qr-amount');
    if (qrSection && order.method === 'COD') {
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${order.total}&cu=INR&tn=KinaraOrder_${order.id}`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
        qrAmt.textContent = `₹${order.total}`;
        qrSection.classList.remove('hidden');
    } else if (qrSection) {
        qrSection.classList.add('hidden');
    }
    
    // Init Map with Cinematic Style
    setTimeout(() => {
        if (historyMap) { historyMap.remove(); historyMap = null; }
        historyMap = L.map('history-map', { zoomControl: false, attributionControl: false }).setView([HOTEL_COORDS.lat, HOTEL_COORDS.lng], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(historyMap);
        
        const hotelIcon = L.icon({
            iconUrl: 'logo-main.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'map-logo-marker shadow-2xl'
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
    if (trackingInterval) clearInterval(trackingInterval);
}

function startTrackingTimer(order) {
    if (trackingInterval) clearInterval(trackingInterval);
    
    // Automatic ETA Calculation: Cooking Time + (Distance * Speed)
    // Minimum 15 mins for any order
    let travelTime = Math.ceil((order.distance || 0) * TRAVEL_SPEED);
    let baseEta = Math.max(15, COOKING_TIME + travelTime);
    
    const update = () => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        
        document.getElementById('live-time').textContent = `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        document.getElementById('live-sec').textContent = s.toString().padStart(2, '0');
        document.getElementById('live-ampm').textContent = h >= 12 ? 'PM' : 'AM';
        document.getElementById('live-day').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
        document.getElementById('live-date').textContent = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

        // ETA countdown simulation (decreases based on time passed since order)
        // Note: order.timestamp should be stored when order is placed
        const orderTime = order.timestamp || Date.now();
        const elapsed = Math.floor((Date.now() - orderTime) / 60000);
        let currentEta = Math.max(2, baseEta - elapsed);
        
        const etaEl = document.getElementById('track-eta');
        if (etaEl) {
            etaEl.innerHTML = `${currentEta} <span class="text-sm uppercase tracking-widest text-stone-400 ml-1">Mins</span>`;
        }

        // Dynamic Status & Map Visual Urgency
        const statusEl = document.getElementById('track-status-text');
        if (currentEta > (travelTime + 2)) {
            statusEl.textContent = 'Preparing Your Feast';
            statusEl.classList.replace('text-primary', 'text-amber-500');
        } else if (currentEta > 5) {
            statusEl.textContent = 'Out for Delivery';
            statusEl.classList.replace('text-amber-500', 'text-primary');
        } else {
            statusEl.textContent = 'Arriving Any Moment';
            statusEl.classList.add('animate-pulse');
        }
    };

    update();
    trackingInterval = setInterval(update, 1000);
}

function openProfile() { 
    document.getElementById('profile-modal').classList.add('open'); 
    renderTableGrids();
}
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
        const nameEl = document.getElementById('prof-name');
        const emailEl = document.getElementById('prof-email');
        const phoneEl = document.getElementById('prof-phone');
        const addrEl = document.getElementById('prof-addr');
        const locStatus = document.getElementById('location-status');

        if (nameEl) nameEl.value = profile.name;
        if (emailEl) emailEl.value = profile.email;
        if (phoneEl) phoneEl.value = profile.phone;
        if (addrEl) addrEl.value = profile.address;
        
        if(profile.coords) { 
            userCoords = profile.coords; 
            if (locStatus) locStatus.classList.remove('hidden'); 
        }
    }
}

function showToast(text) {
    const toast = document.getElementById('toast'); if(!toast) return;
    toast.textContent = text; toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 0)'; }, 3000);
}



// Table Management Logic
const TOTAL_TABLES = 6;

function renderTableGrids() {
    const ordersData = JSON.parse(localStorage.getItem('kinara_orders') || '[]');
    const occupiedTables = new Set();
    ordersData.forEach(o => {
        if (o.mode === 'DINE_IN' && !o.paid && o.table) {
            occupiedTables.add(parseInt(o.table));
        }
    });

    const updateGrid = (gridId, type) => {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        
        const selectedTable = document.getElementById('table-number')?.value;
        const resSelectedValue = document.getElementById('res-selected-table')?.value || '[]';
        const resSelectedTables = resSelectedValue.startsWith('[') ? JSON.parse(resSelectedValue) : [resSelectedValue];
        
        let html = '';
        for (let i = 1; i <= TOTAL_TABLES; i++) {
            const isOccupied = occupiedTables.has(i);
            const isSelected = type === 'res' ? resSelectedTables.includes(i) : (selectedTable == i);
            
            if (type === 'cart' || type === 'res') {
                const clickFn = type === 'res' ? `selectResTable(${i})` : `selectTable(${i})`;
                html += `
                    <button onclick="${isOccupied && type !== 'res' ? '' : clickFn}" 
                        class="h-12 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2
                        ${isOccupied && type !== 'res' ? 'bg-red-50 border-red-100 text-red-400 opacity-50 cursor-not-allowed' : 
                          isSelected ? 'bg-primary border-primary text-white shadow-lg' : 
                          'bg-white border-stone-100 text-stone-600 active:scale-95'}">
                        <span class="text-[10px] font-black">${i < 10 ? '0' + i : i}</span>
                    </button>
                `;
            } else {
                html += `
                    <button onclick="${isOccupied ? `showToast('Table ${i} is busy')` : `selectTableFromHome(${i})`}" 
                        class="h-20 rounded-[28px] flex flex-col items-center justify-center gap-2 border transition-all duration-300 relative overflow-hidden group active:scale-95
                        ${isOccupied ? 'bg-stone-50 border-stone-100 shadow-inner' : 
                          isSelected ? 'bg-primary/5 border-primary shadow-md' : 'bg-white border-stone-100 shadow-sm hover:shadow-md'}">
                        
                        <div class="absolute top-3 right-4 w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-red-500 shadow-[0_0_8px_#ef4444] pulse-red' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}"></div>
                        
                        <span class="material-symbols-outlined text-lg ${isOccupied ? 'text-stone-300' : isSelected ? 'text-primary' : 'text-stone-400'}">restaurant</span>
                        <span class="text-[10px] font-black ${isOccupied ? 'text-stone-400' : 'text-stone-900'} uppercase tracking-widest">T-${i}</span>
                        
                        ${!isOccupied && !isSelected ? '<span class="text-[7px] font-bold text-green-500 uppercase">Book</span>' : ''}
                        ${isSelected ? '<span class="text-[7px] font-bold text-primary uppercase">Active</span>' : ''}
                    </button>
                `;
            }
        }
        grid.innerHTML = html;
    };

    updateGrid('table-grid', 'profile');
    updateGrid('cart-table-grid', 'cart');
    updateGrid('home-table-grid', 'home');
    updateGrid('res-table-grid', 'res');
    
    const availableCount = TOTAL_TABLES - occupiedTables.size;
    const badge = document.getElementById('tables-available-badge');
    const countText = document.getElementById('tables-available-count');
    const homeCountText = document.getElementById('home-available-count');
    
    if (countText) countText.textContent = `${availableCount} Available`;
    if (homeCountText) homeCountText.textContent = `${availableCount} Free`;
    
    if (badge) {
        if (availableCount > 0) {
            badge.classList.remove('bg-red-50', 'border-red-100', 'text-red-700');
            badge.classList.add('bg-green-50', 'border-green-100', 'text-green-700');
        } else {
            badge.classList.remove('bg-green-50', 'border-green-100', 'text-green-700');
            badge.classList.add('bg-red-50', 'border-red-100', 'text-red-700');
        }
    }
}

let resGuests = 2;
let requiredTables = 1;

function openReservation() {
    document.getElementById('reservation-modal').classList.add('open');
    const now = new Date();
    document.getElementById('res-date').value = now.toISOString().split('T')[0];
    document.getElementById('res-time').value = now.toTimeString().slice(0, 5);
    const tableField = document.getElementById('res-selected-table');
    if (tableField) tableField.value = "[]";
    setResGuests(2);
    renderTableGrids();
}

function closeReservation() {
    document.getElementById('reservation-modal').classList.remove('open');
}

function setResGuests(num) {
    resGuests = num;
    requiredTables = Math.ceil(num / 4);
    
    document.querySelectorAll('.res-guest-btn').forEach(btn => {
        const btnNum = parseInt(btn.textContent);
        const isActive = (num >= 10 && btn.textContent.includes('10')) || (btnNum === num);
        btn.classList.toggle('bg-primary', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('border-primary', isActive);
        btn.classList.toggle('text-stone-600', !isActive);
        btn.classList.toggle('border-stone-100', !isActive);
    });
    
    showToast(`${requiredTables} Table(s) required for ${num} guests`);
    renderTableGrids();
}

function selectResTable(num) {
    const tableField = document.getElementById('res-selected-table');
    let selected = JSON.parse(tableField.value || '[]');
    
    if (selected.includes(num)) {
        selected = selected.filter(n => n !== num);
    } else {
        if (selected.length < requiredTables) {
            selected.push(num);
        } else {
            selected.shift();
            selected.push(num);
        }
    }
    
    tableField.value = JSON.stringify(selected);
    renderTableGrids();
}

function submitReservation() {
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const tables = JSON.parse(document.getElementById('res-selected-table').value || '[]');
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    
    if (tables.length < requiredTables) { 
        showToast(`Please select ${requiredTables} table(s)`); 
        return; 
    }
    
    const msg = `*TABLE RESERVATION - KINARA SEA FOOD*\n\n*Name:* ${profile.name || '---'}\n*Phone:* ${profile.phone || '---'}\n*Date:* ${date}\n*Time:* ${time}\n*Guests:* ${resGuests}\n*Tables:* ${tables.join(', ')}\n\n_Please confirm my reservation for ${requiredTables} table(s)._`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    closeReservation();
}

function selectTable(num) {
    const input = document.getElementById('table-number');
    if (input) {
        input.value = num;
        renderTableGrids();
    }
}

function selectTableFromHome(num) {
    selectTable(num);
    openCart();
    showToast(`Table ${num} Selected! Ready to order.`);
}

function requestTableBooking() {
    openReservation();
}

// Initial calls
window.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderCategories();
    renderMenu();
    updateCart();
    startLiveStatusTracker();
    renderTableGrids();
});



function closeStatus() {}
function initiateUPIPayment(amount, orderId) {
    const note = `Order #${orderId}`;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    
    const link = document.createElement('a');
    link.href = upiUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
