// ========================================
// data-config.js - البيانات الموحدة للنظام
// النسخة المُصحَّحة - Single Source of Truth
// ========================================

// ========== 1. مفاتيح التخزين الموحدة ==========
const STORAGE_KEYS = {
    MEMBERS: 'gym_members',
    CLASSES: 'gym_classes',   // ✅ مفتاح موحد يُستخدم في كل مكان
    PLANS: 'gym_plans',
    CONTACT: 'contactMessages',
    STATS: 'gym_stats'
};

// ========== 2. البيانات الافتراضية الموحدة ==========
const DEFAULT_DATA = {
    classes: [
        { id: 1, name: "Bodybuilding Basics", trainer: "Omar Benali", day: "Sunday", time: "16:00 - 18:00", duration: 120, difficulty: "Beginner", capacity: 20 },
        { id: 2, name: "Boxing Training", trainer: "Yacine Bensalem", day: "Monday", time: "18:00 - 19:30", duration: 90, difficulty: "Intermediate", capacity: 15 },
        { id: 3, name: "Karate", trainer: "Walid Mansouri", day: "Sunday", time: "20:00 - 21:30", duration: 90, difficulty: "All Levels", capacity: 25 },
        { id: 4, name: "HIIT Workout", trainer: "Karim Haddad", day: "Thursday", time: "20:00 - 21:00", duration: 60, difficulty: "Advanced", capacity: 12 },
        { id: 5, name: "Weightlifting", trainer: "Samir Bouzid", day: "Saturday", time: "10:00 - 11:30", duration: 90, difficulty: "Intermediate", capacity: 10 }
    ],

    members: [
        { id: 1, name: "Amine Boudiaf", email: "amine@example.com", phone: "0555123456", plan: "Gold", joinDate: "2024-01-15" },
        { id: 2, name: "Riad Cherif", email: "riad@example.com", phone: "0555234567", plan: "Silver", joinDate: "2024-01-20" },
        { id: 3, name: "Nassim Touati", email: "nassim@example.com", phone: "0555345678", plan: "Bronze", joinDate: "2024-02-01" },
        { id: 4, name: "Sofiane Meziane", email: "sofiane@example.com", phone: "0555456789", plan: "Gold", joinDate: "2024-02-10" },
        { id: 5, name: "Abderrahmane Khelifi", email: "abderrahmane@example.com", phone: "0555567890", plan: "Silver", joinDate: "2024-02-15" }
    ],

    plans: [
        { id: 1, name: "Bronze", price: "2000 DA", duration: "1 Month", features: "Gym Access, 2 Classes/Week, Locker Access" },
        { id: 2, name: "Silver", price: "8000 DA", duration: "3 Months", features: "Unlimited Access, Pool, Locker Access" },
        { id: 3, name: "Gold", price: "40000 DA", duration: "12 Months", features: "All Silver Benefits, Personal Trainer, Spa & Sauna Access" }
    ]
};

// ========== 3. دالة مساعدة موحدة: Escape HTML ==========
// ✅ تعريف مرة واحدة هنا - تُستخدم في main.js و admin.js بدون تكرار
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

// ========== 4. دوال إدارة التخزين الموحدة ==========

// تهيئة البيانات الافتراضية عند أول تشغيل
function initializeStorage() {
    for (const [key, defaultValue] of Object.entries(DEFAULT_DATA)) {
        const storageKey = STORAGE_KEYS[key.toUpperCase()];
        if (!localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, JSON.stringify(defaultValue));
            console.log(`✅ تم تهيئة ${key} بالبيانات الافتراضية (مفتاح: ${storageKey})`);
        }
    }
}

// الحصول على البيانات
function getData(key) {
    const storageKey = STORAGE_KEYS[key];
    if (!storageKey) {
        console.warn(`⚠️ مفتاح غير معروف: ${key}`);
        return [];
    }

    let raw = localStorage.getItem(storageKey);

    // إذا لم توجد بيانات، استخدم الافتراضية وخزّنها
    if (!raw) {
        const defaultValue = DEFAULT_DATA[key.toLowerCase()];
        if (defaultValue) {
            localStorage.setItem(storageKey, JSON.stringify(defaultValue));
            raw = JSON.stringify(defaultValue);
        } else {
            return [];
        }
    }

    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`❌ خطأ في تحليل بيانات ${key}:`, e);
        return [];
    }
}

// حفظ البيانات وإطلاق حدث المزامنة
function setData(key, data) {
    const storageKey = STORAGE_KEYS[key];
    if (!storageKey) {
        console.warn(`⚠️ مفتاح غير معروف: ${key}`);
        return;
    }
    localStorage.setItem(storageKey, JSON.stringify(data));

    // إطلاق حدث للتحديث الفوري في نفس التبويب والتبويبات الأخرى
    window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(data)
    }));
}

// إضافة عنصر جديد
function addItem(key, newItem) {
    const items = getData(key);
    newItem.id = Date.now();
    items.push(newItem);
    setData(key, items);
    return newItem;
}

// تحديث عنصر
function updateItem(key, id, updatedData) {
    const items = getData(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
        items[index] = { ...items[index], ...updatedData };
        setData(key, items);
        return true;
    }
    return false;
}

// حذف عنصر
function deleteItem(key, id) {
    const items = getData(key);
    const filtered = items.filter(item => item.id !== id);
    setData(key, filtered);
    return filtered.length !== items.length;
}

// ========== 5. دوال مختصرة للاستخدام الشائع ==========

// الحصول على الحصص بتنسيق مبسط للعرض في الجدول العام (بدون capacity)
function getClassesForDisplay() {
    return getData('CLASSES').map(c => ({
        name: c.name,
        trainer: c.trainer,
        day: c.day,
        time: c.time,
        duration: c.duration,
        difficulty: c.difficulty
    }));
}

// ========== 6. دوال رسائل التواصل ==========
function getContactMessages() {
    const storageKey = STORAGE_KEYS.CONTACT;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('خطأ في قراءة رسائل التواصل:', e);
        return [];
    }
}

function saveContactMessage(messageData) {
    const storageKey = STORAGE_KEYS.CONTACT;
    const messages = getContactMessages();
    const newMessage = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        date: new Date().toISOString(),
        read: false,
        ...messageData
    };
    messages.unshift(newMessage); // الأحدث أولاً
    localStorage.setItem(storageKey, JSON.stringify(messages));
    
    // ✅ إطلاق حدث للتحديث الفوري في لوحة الأدمن
    window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(messages)
    }));
    
    return newMessage;
}

function deleteContactMessage(id) {
    const messages = getContactMessages();
    const filtered = messages.filter(m => m.id !== id);
    const storageKey = STORAGE_KEYS.CONTACT;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return filtered;
}

function markMessageAsRead(id) {
    const messages = getContactMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
        msg.read = true;
        const storageKey = STORAGE_KEYS.CONTACT;
        localStorage.setItem(storageKey, JSON.stringify(messages));
    }
}


function getClassesFull() { return getData('CLASSES'); }
function getMembersFull() { return getData('MEMBERS'); }
function getPlansFull() { return getData('PLANS'); }

// ========== 6. تهيئة النظام ==========
initializeStorage();

// ========== 7. تصدير API الموحد ==========
window.StorageAPI = {
    // دوال CRUD
    getData,
    setData,
    addItem,
    updateItem,
    deleteItem,

    getContactMessages,
    saveContactMessage,
    deleteContactMessage,
    markMessageAsRead,
    // دوال مختصرة
    getClassesForDisplay,
    getClassesFull,
    getMembersFull,
    getPlansFull,
    // ثوابت وبيانات
    STORAGE_KEYS,
    DEFAULT_DATA,
    // دالة مساعدة مشتركة
    escapeHtml
};

console.log('✅ StorageAPI جاهز | المفاتيح:', Object.values(STORAGE_KEYS).join(', '));