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
let userCoords = null; // FIX: declare userCoords to prevent ReferenceError on init

// Initialize the app
function init() {
    loadProfile();
    renderCategories();
    renderMenu();        // FIX: render immediately — no artificial delay needed
    renderOrdersHistory();
    updateCartBadge();  // FIX: only update badge on init, not full cart render
    
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
        const isDeliveryOrder = !isDineIn;
        const isDelivered = order.delivered === true;
        
        return `
            <div class="bg-stone-50 rounded-[28px] p-5 border border-stone-100 mb-4 animate-slide-up">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-[9px] font-black text-stone-300 uppercase tracking-widest">${order.date}</p>
                        <p class="text-[11px] font-extrabold text-stone-900 mt-0.5">ORDER #${order.id}</p>
                        ${isDineIn ? `<p class="text-[9px] font-black text-green-600 uppercase mt-1">Table ${order.table}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-2 items-end">
                        <div class="${(order.method === 'ONLINE' || order.paid) ? 'bg-green-100 text-green-700' : isPayAfter ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-600'} px-3 py-1 rounded-full border border-current/10 text-[9px] font-black uppercase tracking-tighter">
                            ${(order.method === 'ONLINE' || order.paid) ? 'Bill Paid' : isPayAfter ? 'Pay After Meal' : 'COD - Unpaid'}
                        </div>
                        ${isDeliveryOrder && isDelivered ? `
                        <div class="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest">
                            <span class="material-symbols-outlined text-[14px]">check_circle</span> Delivered
                        </div>
                        ` : ''}
                        ${isDeliveryOrder && !isDelivered ? `
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
                            <span>\u20b9${getPrice(i.price) * i.qty}</span>
                        </div>
                    `).join('')}
                    ${order.tip > 0 ? `
                        <div class="flex justify-between text-[10px] font-bold text-green-600">
                            <span>Staff Tip \u2764\ufe0f</span>
                            <span>\u20b9${order.tip}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between pt-2 border-t border-stone-100 items-center">
                        <span class="text-[10px] font-black text-stone-900 uppercase">Total Bill</span>
                        <span class="text-sm font-black text-primary">\u20b9${order.total}</span>
                    </div>
                </div>

                ${isDeliveryOrder && !isDelivered ? `
                <button onclick="markDelivered('${order.id}')" class="w-full mt-2 bg-green-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-600/20">
                    <span class="material-symbols-outlined text-[18px]">check_circle</span>
                    I Received My Order
                </button>
                ` : ''}

                ${isPayAfter && !order.paid ? `
                <div id="history-pay-${order.id}" class="mt-4 bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm animate-fade-in">

                    <!-- Header -->
                    <div class="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-stone-50">
                        <div class="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                            <span class="material-symbols-outlined text-[20px]">qr_code_2</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-stone-900 uppercase tracking-widest">Settle Bill</p>
                            <p class="text-[9px] font-bold text-stone-400">\u20b9${order.total} &middot; Table ${order.table || '-'}</p>
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
        if (heading)  heading.textContent = 'Thanks for Dining! \uD83D\uDE4F';
        if (subtitle) subtitle.textContent = 'Hope you loved your Malvani feast!';
        if (icon)     icon.textContent = 'restaurant';
    } else {
        if (heading)  heading.textContent = 'Order Delivered! \uD83C\uDF89';
        if (subtitle) subtitle.textContent = 'Thank you for choosing Kinara Seafood';
        if (icon)     icon.textContent = 'verified';
    }

    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
}

function sharePaymentSS(orderId, amount) {
    const profile = JSON.parse(localStorage.getItem('kinara_profile') || '{}');
    let msg = `*PAYMENT VERIFICATION (DINE-IN) - KINARA SEA FOOD*\n*Order ID:* #${orderId}\n*Amount:* \u20b9${amount}\n\n*Customer:* ${profile.name}\n\n_I have just paid the bill for my dine-in order. Sharing the screenshot below..._`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    // No auto overlay — user confirms manually via BILL PAID button
}

// Dine-In: customer taps BILL PAID — button turns green → Thank You overlay
function confirmDineinPaid(orderId) {
    const idx = orders.findIndex(o => o.id == orderId);
    if (idx !== -1) {
        orders[idx].paid = true;
        localStorage.setItem('kinara_orders', JSON.stringify(orders));
    }

    const btn = document.getElementById(`bill-paid-btn-${orderId}`);
    if (btn) {
        btn.disabled = true;
        btn.classList.remove('bg-stone-900', 'shadow-lg');
        btn.classList.add('bg-green-600', 'shadow-green-600/20');
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span> Bill Paid \u2713';
    }
    
    setTimeout(() => {
        renderOrdersHistory(); // Update list to hide QR card
        showThankYouOverlay(true);
    }, 700);
}

// Live Time & Shop Status Tracker
function startLiveStatusTracker() {
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
    const cats = ['All', ...menuData.categories.map(c => c.name)];
    row.innerHTML = cats.map(cat => {
        const isActive = cat === currentCategory;
        const activeClass = isActive ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-white text-stone-500 border-stone-100 hover:bg-stone-50";
        return `<button class="px-6 py-3 rounded-2xl flex-shrink-0 font-black text-[10px] border transition-all whitespace-nowrap uppercase tracking-widest ${activeClass}" onclick="setCat('${cat}')">${cat}</button>`;
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
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    
    const allItems = getFlattenedMenu();
    let filteredItems = allItems;

    if (currentCategory !== 'All') filteredItems = filteredItems.filter(i => i.categoryName === currentCategory);
    if (isVegOnly) filteredItems = filteredItems.filter(i => i.isVeg === true);
    if (searchQuery) filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(searchQuery));

    const cartMap = new Map();
    cart.forEach(c => cartMap.set(c.id, c.qty));

    if (filteredItems.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-stone-400 font-medium">No items found.</div>`;
        return;
    }

    // If 'All' is selected, we group by category to provide the "headings" requested
    if (currentCategory === 'All' && !searchQuery) {
        let html = '';
        menuData.categories.forEach(cat => {
            const catItems = filteredItems.filter(i => i.categoryName === cat.name);
            if (catItems.length > 0) {
                html += `
                    <div class="col-span-full mt-8 mb-4 px-1">
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
}

function renderMenuItem(item, idx, cartMap) {
    const qty = cartMap.get(item.id);
    // FIX: add data-item-id so updateMenuItemButton() can find this card without re-rendering
    return `
        <div class="glass-card rounded-[24px] overflow-hidden flex flex-col h-full group transition-all hover:shadow-xl active:scale-95 duration-500 border border-white/20 animate-slide-up" data-item-id="${item.id}" style="animation-delay: ${idx * 0.01}s">
            <div class="relative aspect-square overflow-hidden bg-stone-50/30">
                <img src="${item.image}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${item.name}">
                <div class="absolute top-3 right-3 veg-indicator ${item.isVeg ? 'veg' : 'non-veg'} shadow-sm"><div></div></div>
            </div>
            <div class="p-4 flex flex-col flex-1">
                <h4 class="font-bold text-stone-800 text-[11px] uppercase tracking-tight leading-tight mb-3 line-clamp-2">${item.name}</h4>
                <div class="mt-auto flex items-center justify-between gap-2">
                    <span class="font-black text-stone-900 text-[13px]">${isNaN(parseFloat(item.price)) ? item.price : '₹' + item.price}</span>
                    <div class="item-btn-area">
                    ${qty ? `
                        <div class="flex items-center gap-2 bg-stone-100/80 rounded-xl p-1 border border-stone-200/30 backdrop-blur-sm">
                            <button onclick="changeQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center text-stone-900 font-bold bg-white rounded-lg shadow-sm active:scale-90 transition-all text-xs">−</button>
                            <span class="font-black text-primary text-[11px] w-4 text-center">${qty}</span>
                            <button onclick="changeQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center text-white font-bold bg-primary rounded-lg shadow-sm active:scale-90 transition-all text-xs">+</button>
                        </div>
                    ` : `<button onclick="addToCart('${item.id}')" class="bg-stone-900 text-white px-4 py-2 rounded-xl font-black text-[9px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-stone-900/10">Add</button>`}
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
    // FIX: only patch the specific menu card button instead of rebuilding the whole grid
    if (itemId !== undefined) {
        updateMenuItemButton(itemId);
    }
}

function updateCartBadge() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const { itemTotal, deliveryFee, grandTotal, distance } = calculateCartTotals();

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

    // Doorstep QR: show only for COD delivery orders
    const qrSection = document.getElementById('doorstep-qr-section');
    const qrImg = document.getElementById('doorstep-qr-img');
    const qrAmt = document.getElementById('doorstep-qr-amount');
    if (qrSection && order.method === 'COD') {
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${order.total}&cu=INR&tn=KinaraOrder_${order.id}`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
        qrAmt.textContent = `\u20b9${order.total}`;
        qrSection.classList.remove('hidden');
    } else if (qrSection) {
        qrSection.classList.add('hidden');
    }
    
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
