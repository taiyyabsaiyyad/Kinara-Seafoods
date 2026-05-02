const menuData = {
  categories: [
    {
      id: "starters",
      name: "Starters",
      icon: "🦐",
      items: [
        { id: "s1", name: "Crab Lollipop", price: 250, image: "menu/images/Crab Lollipop.jpg", isVeg: false },
        { id: "s2", name: "Butter Garlic Prawns", price: 260, image: "menu/images/Butter Garlic Prawns.jfif", isVeg: false },
        { id: "s3", name: "Butter Garlic Chicken", price: 260, image: "menu/images/Butter Garlic Chicken.jpg", isVeg: false },
        { id: "s4", name: "Fish Cutlets", price: 190, image: "menu/images/Fish Cutlets.webp", isVeg: false },
        { id: "s5", name: "Jawla Bhaji", price: 190, image: "menu/images/Javla Bhaji.jpg", isVeg: false },
        { id: "s6", name: "Chicken Tawa Masala", price: 270, image: "menu/images/Chicken Tawa Masala.jpg", isVeg: false },
        { id: "s7", name: "Chicken Kolivada", price: 260, image: "menu/images/Chicken Kolivada.jpg", isVeg: false },
        { id: "s8", name: "Prawns Kolivada", price: 360, image: "menu/images/Prawns Kolivada.jfif", isVeg: false },
        { id: "s9", name: "Paneer Kolivada (Veg)", price: 260, image: "menu/images/Paneer Kolivada (Veg).jfif", isVeg: true },
        { id: "s10", name: "Kothimbir Wadi (Veg)", price: 200, image: "menu/images/Kothimbir Wadi (Veg).jpg", isVeg: true }
      ]
    },
    {
      id: "main-course",
      name: "Main Course",
      icon: "🍛",
      items: [
        { id: "m1", name: "Prawns Malvani", price: 260, image: "menu/images/Prawns Malvani.jpg", isVeg: false },
        { id: "m2", name: "Chicken Malvani", price: 240, image: "menu/images/Chicken Malvani.jpg", isVeg: false },
        { id: "m3", name: "Chicken Sukka", price: 220, image: "menu/images/Chicken Sukka.jfif", isVeg: false },
        { id: "m4", name: "Prawns Sukka", price: 260, image: "menu/images/Prawns Sukka.jpg", isVeg: false },
        { id: "m5", name: "Kombadi Vade", price: 280, image: "menu/images/Kombadi Vade.jpg", isVeg: false },
        { id: "m6", name: "Bangda Curry", price: 260, image: "menu/images/Bangda Curry.jpg", isVeg: false },
        { id: "m7", name: "Surmai Curry", price: 350, image: "menu/images/Surmai Curry.png", isVeg: false },
        { id: "m8", name: "Pomfret Curry", price: 450, image: "menu/images/Pomfret Curry.jpg", isVeg: false },
        { id: "m9", name: "Anda Curry", price: 180, image: "menu/images/Anda Curry.jfif", isVeg: false },
        { id: "m10", name: "Chicken Handi", price: 440, image: "menu/images/Chicken Handi.avif", isVeg: false },
        { id: "m11", name: "Mutton Handi", price: 680, image: "menu/images/Mutton Handi.avif", isVeg: false },
        { id: "m12", name: "Paneer Malvani (Veg)", price: 220, image: "menu/images/Paneer Malvani (Veg).jpg", isVeg: true },
        { id: "m13", name: "Dal Tadka (Veg)", price: 150, image: "menu/images/Dal Tadka (Veg).webp", isVeg: true }
      ]
    },
    {
      id: "biryani",
      name: "Biryani",
      icon: "🍚",
      items: [
        { id: "b1", name: "Chicken Biryani", price: 360, image: "menu/images/Chicken Biryani.jpg", isVeg: false },
        { id: "b2", name: "Mutton Biryani", price: 440, image: "menu/images/Mutton Biryani.jpg", isVeg: false },
        { id: "b3", name: "Prawns Biryani", price: 380, image: "menu/images/Prawns Biryani.jpg", isVeg: false },
        { id: "b4", name: "Surmai Biryani", price: 450, image: "menu/images/Surmai Biryani.webp", isVeg: false },
        { id: "b5", name: "Paneer Biryani", price: 330, image: "menu/images/Paneer Biryani.jpg", isVeg: true }
      ]
    },
    {
      id: "seafood-thali",
      name: "Sea Food Thali",
      icon: "🍽️",
      items: [
        { id: "st1", name: "Surmai Thali", price: "APS", image: "menu/images/Surmai Thali.avif", isVeg: false },
        { id: "st2", name: "Prawns Thali", price: "APS", image: "menu/images/Prawns Thali.jfif", isVeg: false },
        { id: "st3", name: "Pomfret Thali", price: "APS", image: "menu/images/Pomfret Thali.avif", isVeg: false },
        { id: "st4", name: "Bombil Thali", price: "APS", image: "menu/images/Bombil Thali.jfif", isVeg: false },
        { id: "st5", name: "Bangda Thali", price: "APS", image: "menu/images/Bangda Thali.jfif", isVeg: false },
        { id: "st6", name: "Jitada / Chonak Thali", price: "APS", image: "menu/images/Jitada_Chonak Thali.jfif", isVeg: false }
      ]
    },
    {
      id: "non-veg-thali",
      name: "Non-Veg Thali",
      icon: "🍗",
      items: [
        { id: "nvt1", name: "Chicken Thali", price: 270, image: "menu/images/Chicken Thali.jfif", isVeg: false },
        { id: "nvt2", name: "Anda Thali", price: 230, image: "menu/images/Anda Thali.jpg", isVeg: false },
        { id: "nvt3", name: "Mutton Thali", price: 480, image: "menu/images/Mutton Thali.avif", isVeg: false }
      ]
    },
    {
      id: "veg-thali",
      name: "Veg Thali",
      icon: "🥗",
      items: [
        { id: "vt1", name: "Veg Thali", price: 175, image: "menu/images/Veg Thali.avif", isVeg: true },
        { id: "vt2", name: "Kinara Special Thali", price: 225, image: "menu/images/Kinara Special Thali.jpg", isVeg: true }
      ]
    },
    {
      id: "beverages",
      name: "Beverages",
      icon: "🍹",
      items: [
        { id: "bev1", name: "Solkadhi", price: 70, image: "menu/images/Solkadhi.webp", isVeg: true },
        { id: "bev2", name: "Kokam Sarbat", price: 70, image: "menu/images/Kokam Sarbat.jpg", isVeg: true },
        { id: "bev3", name: "Kokam Mojito", price: 70, image: "menu/images/Kokam Mojito.jfif", isVeg: true }
      ]
    },
    {
      id: "desserts",
      name: "Desserts",
      icon: "🍨",
      items: [
        { id: "d1", name: "Gulab Jamun", price: 30, image: "menu/images/Gulab Jamun.jpg", isVeg: true },
        { id: "d2", name: "Ukadiche Modak", price: 45, image: "menu/images/Ukadiche Modak.jpg", isVeg: true },
        { id: "d3", name: "Ukadiche Modak with Ghee", price: 50, image: "menu/images/Ukadiche Modak with Ghee.jfif", isVeg: true }
      ]
    },
    {
      id: "extras",
      name: "Extras",
      icon: "➕",
      items: [
        { id: "e1", name: "Steam Rice", price: "80", image: "menu/images/Steam Rice.jfif", isVeg: true },
        { id: "e2", name: "Jeera Rice", price: "110", image: "menu/images/Jeera Rice.jpg", isVeg: true },
        { id: "e3", name: "Bhakri", price: 28, image: "menu/images/Bhakri.jpg", isVeg: true },
        { id: "e4", name: "Chapati", price: 18, image: "menu/images/Chapati.jpg", isVeg: true },
        { id: "e5", name: "Butter Chapati", price: 22, image: "menu/images/Butter Chapati.jfif", isVeg: true },
        { id: "e6", name: "Vade", price: 90, image: "menu/images/Vade.jfif", isVeg: true }
      ]
    }
  ],
  contact: {
    phones: ["7045528239", "9326367690"],
    address: "Shop No. 4, Chandrai Arcade, Sector-20, Nerul West, Navi Mumbai, Maharashtra - 400706",
    timings: {
      weekday: "11:30 am to 11:00 pm",
      weekend: "12:00 pm to 12:00 am"
    }
  },
  paymentQr: "menu/WhatsApp Image 2026-05-01 at 10.01.37 PM.jpeg"
};

// Payment Details & Config can also stay here
const KINARA_CONFIG = {
    UPI_ID: 'tabsaiyyad@okicici',
    UPI_NAME: 'Kinara Sea Food',
    WA_NUMBER: '917045528239'
};
