// ========================================
// main.js - Force One Gym
// النسخة المُصحَّحة والمُوحَّدة
// ملاحظة: يجب تحميل data-config.js قبل هذا الملف
// ========================================

// ========== 1. دوال مساعدة ==========

// ✅ escapeHtml تأتي من data-config.js عبر window.StorageAPI.escapeHtml
// لا حاجة لإعادة تعريفها هنا - نستخدم نسخة StorageAPI مباشرة
function escapeHtml(str) {
    return window.StorageAPI ? window.StorageAPI.escapeHtml(str) : String(str || '');
}

// إشعارات منبثقة
function showNotification(message, type = "info") {
    const existing = document.querySelector(".gym-notification");
    if (existing) existing.remove();

    const colors = { success: "#2ecc71", error: "#e74c3c", info: "#3498db" };
    const n = document.createElement("div");
    n.className = "gym-notification";
    n.style.cssText = `
        position:fixed;top:20px;right:20px;padding:12px 20px;
        background:${colors[type] || colors.info};color:#fff;
        border-radius:8px;z-index:3000;font-weight:bold;
        box-shadow:0 5px 15px rgba(0,0,0,.3);
        animation:slideIn .3s ease;
    `;
    n.textContent = message;
    document.body.appendChild(n);

    setTimeout(() => {
        n.style.animation = "slideOut .3s ease";
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// ========== 2. مزامنة البيانات بين التبويبات ==========

window.addEventListener('storage', function (event) {
    // ✅ المفاتيح الموحدة من STORAGE_KEYS فقط
    const watchedKeys = ['gym_classes', 'gym_members', 'gym_plans'];
    if (!watchedKeys.includes(event.key)) return;

    console.log('🔄 تحديث البيانات من تبويب آخر:', event.key);

    if (event.key === 'gym_classes') {
        classesData = getClassesFromStorage();
        if (document.getElementById("tableBody")) updateClasses();
    }
    if (typeof updateLiveStats === 'function') updateLiveStats();
    if (typeof loadDynamicPlans === 'function') loadDynamicPlans();
});

// ========== 3. صفحة الحصص ==========

// ✅ لا يوجد CLASSES_STORAGE_KEY منفصل - نستخدم StorageAPI مباشرة

// قراءة الحصص للعرض في الجدول العام (مبسطة)
function getClassesFromStorage() {
    if (window.StorageAPI) return window.StorageAPI.getClassesForDisplay();
    return [];
}

let classesData = getClassesFromStorage();

let classesState = {
    level: "All",
    days: [],
    trainer: "",
    sortField: "",
    sortDir: "asc"
};

function updateClassCount() {
    const el = document.getElementById('classCount');
    if (el) el.innerHTML = `📋 Total Classes: ${classesData.length}`;
}

function getBadgeClass(level) {
    const map = {
        "Beginner": "beginner",
        "Intermediate": "intermediate",
        "Advanced": "advanced",
        "All Levels": "all-levels"
    };
    return map[level] || "all-levels";
}

function renderClassesTable(data) {
    const body = document.getElementById("tableBody");
    if (!body) return;

    if (!data.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center">No classes found</td></tr>`;
        return;
    }

    body.innerHTML = data.map(c => `
        <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.trainer)}</td>
            <td>${escapeHtml(c.day)}</td>
            <td>${escapeHtml(c.time)}</td>
            <td>${escapeHtml(c.duration)} min</td>
            <td><span class="badge ${getBadgeClass(c.difficulty)}">${escapeHtml(c.difficulty)}</span></td>
        </tr>
    `).join("");
}

function updateClasses() {
    let data = classesData.filter(c =>
        (!classesState.trainer || c.trainer === classesState.trainer) &&
        (!classesState.days.length || classesState.days.includes(c.day)) &&
        (
            classesState.level === "All" ||
            c.difficulty === classesState.level ||
            c.difficulty === "All Levels"  // ✅ تظهر دائماً مع أي فلتر
        )
    );

    if (classesState.sortField) {
        data.sort((a, b) => {
            let A = a[classesState.sortField];
            let B = b[classesState.sortField];
            if (classesState.sortField === "time") { A = A.split(" - ")[0]; B = B.split(" - ")[0]; }
            const dir = classesState.sortDir === "asc" ? 1 : -1;
            return typeof A === "string" ? A.localeCompare(B) * dir : (A - B) * dir;
        });
    }

    renderClassesTable(data);
    updateSortArrows();
    updateClassCount();
}

function updateSortArrows() {
    document.querySelectorAll(".sortable").forEach(th => {
        th.textContent = th.textContent.replace(/[▲▼]/g, "").trim();
        if (th.dataset.field === classesState.sortField) {
            th.textContent += classesState.sortDir === "asc" ? " ▲" : " ▼";
        }
    });
}

function loadTrainersFilter() {
    const select = document.getElementById("trainerFilter");
    if (!select) return;
    select.innerHTML = '<option value="">All Trainers</option>';
    [...new Set(classesData.map(c => c.trainer))].forEach(t => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = t;
        select.appendChild(opt);
    });
}

function loadDayButtons() {
    const box = document.getElementById("dayButtons");
    if (!box) return;
    box.innerHTML = '';
    [...new Set(classesData.map(c => c.day))].forEach(day => {
        const btn = document.createElement("button");
        btn.textContent = day;
        btn.className = "day-btn";
        btn.onclick = () => {
            classesState.days.includes(day)
                ? classesState.days = classesState.days.filter(d => d !== day)
                : classesState.days.push(day);
            btn.classList.toggle("active");
            updateClasses();
        };
        box.appendChild(btn);
    });
}

function initClassesPage() {
    loadTrainersFilter();
    loadDayButtons();

    const trainerFilter = document.getElementById("trainerFilter");
    if (trainerFilter) trainerFilter.onchange = e => { classesState.trainer = e.target.value; updateClasses(); };

    document.querySelectorAll(".difficulty-btn").forEach(btn => {
        btn.onclick = () => {
            classesState.level = btn.dataset.level;
            document.querySelectorAll(".difficulty-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updateClasses();
        };
    });

    document.querySelectorAll(".sortable").forEach(th => {
        th.onclick = () => {
            const field = th.dataset.field;
            classesState.sortDir = classesState.sortField === field && classesState.sortDir === "asc" ? "desc" : "asc";
            classesState.sortField = field;
            updateClasses();
        };
    });

    // ✅ الاستماع لتحديثات الأدمن في نفس التبويب
    window.addEventListener('storage', (e) => {
        if (e.key === 'gym_classes') {
            classesData = getClassesFromStorage();
            loadTrainersFilter();
            loadDayButtons();
            updateClasses();
        }
    });

    updateClasses();
}

// ========== 4. صفحة المدربين ==========

const trainersData = [
    {
        id: 1,
        name: "Omar Benali",
        specialty: "Bodybuilding",
        experience: "8 years",
        bio: "Certified fitness coach specializing in muscle building and strength training. Omar has helped hundreds of clients achieve their bodybuilding goals through personalized workout plans and nutrition guidance.",
        image: "imag/trainers 1.jpg",
        schedule: [
            { day: "Monday", time: "10:00 - 12:00", class: "Bodybuilding Basics" },
            { day: "Wednesday", time: "16:00 - 18:00", class: "Advanced Strength" },
            { day: "Friday", time: "14:00 - 16:00", class: "Muscle Building" }
        ],
        certifications: [
            "Certified Personal Trainer (CPT)",
            "Nutrition Specialist"
        ]
    },
    {
        id: 2,
        name: "Yacine Bensalem",
        specialty: "Boxing",
        experience: "10 years",
        bio: "Professional boxing trainer focused on endurance and competitive training. Former regional champion with expertise in technique, footwork, and fight strategy.",
        image: "imag/trainers 2.jpg",
        schedule: [
            { day: "Monday", time: "18:00 - 19:30", class: "Boxing Training" },
            { day: "Wednesday", time: "19:00 - 20:30", class: "Sparring Session" },
            { day: "Saturday", time: "09:00 - 10:30", class: "Boxing Fundamentals" }
        ],
        certifications: [
            "Professional Boxing Coach",
            "Sports Psychology Certificate"
        ]
    },
    {
        id: 3,
        name: "Walid Mansouri",
        specialty: "Karate",
        experience: "6 years",
        bio: "Black belt karate instructor with expertise in traditional and modern techniques. Specializes in self-defense, discipline, and competitive karate training.",
        image: "imag/trainers 3.jpg",
        schedule: [
            { day: "Sunday", time: "20:00 - 21:30", class: "Karate" },
            { day: "Tuesday", time: "17:00 - 18:30", class: "Self Defense" },
            { day: "Thursday", time: "19:00 - 20:30", class: "Advanced Karate" }
        ],
        certifications: [
            "Black Belt 3rd Dan",
            "Karate Instructor Certification"
        ]
    },
    {
        id: 4,
        name: "Karim Haddad",
        specialty: "HIIT Workout",
        experience: "5 years",
        bio: "High-intensity interval training expert focused on fat loss and cardiovascular health. Known for energetic classes and motivational coaching style.",
        image: "imag/trainers 4.jpg",
        schedule: [
            { day: "Tuesday", time: "18:00 - 19:00", class: "HIIT Burn" },
            { day: "Thursday", time: "20:00 - 21:00", class: "HIIT Workout" },
            { day: "Saturday", time: "11:00 - 12:00", class: "Weekend HIIT" }
        ],
        certifications: [
            "HIIT Specialist",
            "Functional Training Certificate"
        ]
    },
    {
        id: 5,
        name: "Samir Bouzid",
        specialty: "Weightlifting",
        experience: "8 years",
        bio: "Specialist in Olympic lifting techniques and advanced strength programs. Experienced in training athletes for strength and powerlifting competitions.",
        image: "imag/trainers 5.jpg",
        schedule: [
            { day: "Monday", time: "09:00 - 10:30", class: "Weightlifting Basics" },
            { day: "Wednesday", time: "14:00 - 15:30", class: "Olympic Lifting" },
            { day: "Saturday", time: "10:00 - 11:30", class: "Advanced Strength" }
        ],
        certifications: [
            "Weightlifting Coach Level 2",
            "Strength and Conditioning Specialist"
        ]
    }
];

function renderTrainers(trainers) {
    const container = document.getElementById("trainers-info");
    if (!container) return;

    if (!trainers.length) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                No trainers found matching your search.
                <br><small>Try searching by name or specialty</small>
            </div>`;
        return;
    }

    container.innerHTML = trainers.map(t => `
        <article data-id="${t.id}" onclick="openTrainerModal(${t.id})">
            <figure>
                <img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.name)} - ${escapeHtml(t.specialty)} Trainer">
                <figcaption>${escapeHtml(t.name)} - ${escapeHtml(t.specialty)} Specialist</figcaption>
            </figure>
            <h2>${escapeHtml(t.name)}</h2>
            <p><strong>Specialty:</strong> ${escapeHtml(t.specialty)}</p>
            <p><strong>Experience:</strong> ${escapeHtml(t.experience)}</p>
            <p>${escapeHtml(t.bio.substring(0, 80))}...</p>
            <p><a href="#" onclick="event.preventDefault(); openTrainerModal(${t.id})">View Details →</a></p>
        </article>
    `).join('');
}

function openTrainerModal(trainerId) {
    const trainer = trainersData.find(t => t.id === trainerId);
    if (!trainer) return;

    const modal = document.getElementById("trainerModal");
    const modalBody = document.getElementById("modalBody");
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <img src="${escapeHtml(trainer.image)}" alt="${escapeHtml(trainer.name)}" class="modal-img"
             onerror="this.src='https://via.placeholder.com/180?text=No+Image'">
        <h2>${escapeHtml(trainer.name)}</h2>
        <span class="modal-specialty">${escapeHtml(trainer.specialty)}</span>
        <div class="modal-detail">
            <p><strong>📅 Experience:</strong> ${escapeHtml(trainer.experience)}</p>
            <p><strong>📜 Certifications:</strong> ${trainer.certifications.map(escapeHtml).join(", ")}</p>
        </div>
        <div class="modal-detail">
            <strong>📋 Class Schedule:</strong>
            <ul class="schedule-list">
                ${trainer.schedule.map(s => `
                    <li>
                        <span class="schedule-day">${escapeHtml(s.day)}</span>
                        <span>${escapeHtml(s.time)}</span>
                        <span>${escapeHtml(s.class)}</span>
                    </li>`).join('')}
            </ul>
        </div>
        <div class="modal-bio">
            <strong>💬 About ${escapeHtml(trainer.name.split(' ')[0])}:</strong>
            <p style="margin-top:10px">${escapeHtml(trainer.bio)}</p>
        </div>`;

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeTrainerModal() {
    const modal = document.getElementById("trainerModal");
    if (modal) { modal.classList.remove("show"); document.body.style.overflow = ""; }
}

function filterTrainers() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    const term = input.value.toLowerCase().trim();
    renderTrainers(trainersData.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.specialty.toLowerCase().includes(term) ||
        t.bio.toLowerCase().includes(term)
    ));
}

function initTrainersPage() {
    renderTrainers(trainersData);
    const searchInput = document.getElementById("searchInput");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modal = document.getElementById("trainerModal");

    if (searchInput) {
        let timer;
        searchInput.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(filterTrainers, 300); });
    }
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeTrainerModal);
    if (modal) modal.addEventListener("click", e => { if (e.target === modal) closeTrainerModal(); });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && modal?.classList.contains("show")) closeTrainerModal();
    });
}

// ========== 5. صفحة العضوية ==========

let selectedPlan = null, selectedPlanName = null, selectedPlanPrice = null, selectedPlanDuration = null;
let selectedPlanId = null;

function selectPlan(planId, planName, price, duration) {
    selectedPlanId = planId;
    selectedPlan = planId;
    selectedPlanName = planName;
    selectedPlanPrice = price;
    selectedPlanDuration = duration;
    sessionStorage.setItem("selectedPlan", JSON.stringify({ id: planId, name: planName, price, duration }));
    updateCartUI();
    updatePlanDisplay();
    showNotification(`${planName} plan selected!`, "success");
}

function clearCart() {
    selectedPlan = selectedPlanName = selectedPlanPrice = selectedPlanDuration = null;
    sessionStorage.removeItem("selectedPlan");
    updateCartUI();
    updatePlanDisplay();
    showNotification("Plan removed from cart", "info");
}

// ========== الدوال الجديدة للخطط الديناميكية (أضفها هنا) ==========

// جلب الخطط من التخزين
function fetchPlans() {
    try {
        if (window.StorageAPI && typeof window.StorageAPI.getData === 'function') {
            const plans = window.StorageAPI.getData('PLANS');
            if (plans && plans.length) return plans;
        }
        const plansData = localStorage.getItem('gym_plans');
        if (plansData) {
            const plans = JSON.parse(plansData);
            if (plans && plans.length) return plans;
        }
        return getDefaultPlans();
    } catch (error) {
        return getDefaultPlans();
    }
}

// الخطط الافتراضية
function getDefaultPlans() {
    return [
        { id: 1, name: "Bronze", price: "2000 DA", duration: "1 Month", features: "Gym Access, 2 Classes/Week, Locker Access" },
        { id: 2, name: "Silver", price: "8000 DA", duration: "3 Months", features: "Unlimited Access, Pool, Locker Access" },
        { id: 3, name: "Gold", price: "40000 DA", duration: "12 Months", features: "All Silver Benefits, Personal Trainer, Spa & Sauna Access" }
    ];
}

// تحويل الميزات إلى مصفوفة
function parseFeaturesToArray(featuresText) {
    if (!featuresText) return [];
    if (featuresText.includes(',') && !featuresText.includes('✓')) {
        return featuresText.split(',').map(f => f.trim());
    }
    if (featuresText.includes('✓')) {
        return featuresText.split('✓').filter(f => f.trim()).map(f => f.trim());
    }
    return [featuresText];
}

// عرض الخطط ديناميكياً
function renderPlans() {
    const container = document.getElementById('plans-container');
    if (!container) return;

    const plans = fetchPlans();

    if (!plans.length) {
        container.innerHTML = `<div class="error-message">⚠️ No plans available</div>`;
        return;
    }

    container.innerHTML = plans.map(plan => {
        const numericPrice = plan.price.replace(' DA', '').trim();
        const featuresList = parseFeaturesToArray(plan.features);

        return `
            <article class="plan-card">
                <h3>${escapeHtml(plan.name)}</h3>
                <div class="plan-price">${escapeHtml(plan.price)}<span> /${escapeHtml(plan.duration)}</span></div>
                <ul class="plan-features">
                    ${featuresList.map(f => `<li>✓ ${escapeHtml(f)}</li>`).join('')}
                </ul>
                <button class="select-plan-btn" 
                        onclick="selectPlan(${plan.id}, '${escapeHtml(plan.name)}', '${escapeHtml(plan.price)}', '${escapeHtml(plan.duration)}')">
                    Select Plan
                </button>
            </article>
        `;
    }).join('');
}

// الاستماع لتغييرات الخطط
function listenToPlanChanges() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'gym_plans') {
            renderPlans();
            if (selectedPlanId) {
                const plans = fetchPlans();
                const planStillExists = plans.some(p => p.id === selectedPlanId);
                if (!planStillExists) clearCart();
            }
        }
    });
}

function updateCartUI() {
    const cartDiv = document.getElementById("cart");
    if (!cartDiv) return;
    cartDiv.innerHTML = selectedPlan
        ? `<span>🛒 Selected: <strong>${escapeHtml(selectedPlanName)}</strong> (${escapeHtml(selectedPlanPrice)} / ${escapeHtml(selectedPlanDuration)})</span>
           <button onclick="clearCart()">✖ Remove</button>`
        : `<span>📦 No plan selected</span>`;
}

function updatePlanDisplay() {
    const el = document.getElementById("planDisplay");
    if (!el) return;
    el.innerHTML = selectedPlan
        ? `<div style="background:#2ecc71;color:#080808;padding:10px;border-radius:5px">
               ✅ Selected Plan: <strong>${escapeHtml(selectedPlanName)}</strong>
               (${escapeHtml(selectedPlanPrice)} / ${escapeHtml(selectedPlanDuration)})
           </div>`
        : `<div style="padding:10px;background:#e74c3c;border-radius:5px">
               ⚠️ No plan selected. Please click "Select Plan" on a membership card above.
           </div>`;
}

function calculateAge(birthDate) {
    const today = new Date(), birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function validateFullName() {
    const el = document.getElementById("fullname"), err = document.getElementById("fullnameError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Full name is required"; el.className = "error"; return false; }
    if (!/^[A-Za-z\s]{3,}$/.test(v)) { err.textContent = "Name must be at least 3 characters (letters only)"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validateEmailMembership() {
    const el = document.getElementById("email"), err = document.getElementById("emailError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Email is required"; el.className = "error"; return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = "Please enter a valid email address"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validatePhone() {
    const el = document.getElementById("phone"), err = document.getElementById("phoneError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Phone number is required"; el.className = "error"; return false; }
    if (!/^[0-9]{8,15}$/.test(v)) { err.textContent = "Phone must be 8-15 digits only"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validateDOB() {
    const el = document.getElementById("dob"), err = document.getElementById("dobError");
    if (!el || !err) return true;
    const v = el.value;
    if (!v) { err.textContent = "Date of birth is required"; el.className = "error"; return false; }
    if (calculateAge(v) < 16) { err.textContent = "You must be at least 16 years old"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validatePlanSelection() {
    if (!selectedPlan) { updatePlanDisplay(); return false; }
    return true;
}

function validateTerms() {
    const cb = document.getElementById("termsCheckbox"), err = document.getElementById("termsError");
    if (!cb || !err) return true;
    if (!cb.checked) { err.textContent = "You must agree to the terms and conditions"; return false; }
    err.textContent = ""; return true;
}

function validateMembershipForm() {
    return validateFullName() && validateEmailMembership() && validatePhone() &&
        validateDOB() && validatePlanSelection() && validateTerms();
}

function showSuccessMessage(email) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);display:flex;justify-content:center;align-items:center;z-index:2000";
    overlay.innerHTML = `
        <div style="background:#1a1a1a;padding:2rem;border-radius:12px;text-align:center;max-width:400px">
            <i class="fas fa-check-circle" style="font-size:4rem;color:#2ecc71"></i>
            <h3 style="margin:1rem 0">Registration Successful!</h3>
            <p>Thank you for joining our gym family!</p>
            <p style="margin-top:1rem;color:#2ecc71">A confirmation email has been sent to ${escapeHtml(email)}</p>
            <button onclick="this.closest('div').parentElement.remove()"
                    style="margin-top:1rem;padding:10px 30px;background:#e74c3c;border:none;border-radius:5px;cursor:pointer;color:#fff">
                Close
            </button>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

function resetMembershipForm() {
    const form = document.getElementById("registrationForm");
    if (form) form.reset();
    document.querySelectorAll("#fullname,#email,#phone,#dob").forEach(el => el?.classList.remove("success", "error"));
    clearCart();
}

function loadSavedPlan() {
    try {
        const saved = sessionStorage.getItem("selectedPlan");
        if (!saved) return;
        const plan = JSON.parse(saved);
        selectedPlan = plan.id; selectedPlanName = plan.name;
        selectedPlanPrice = plan.price; selectedPlanDuration = plan.duration;
        updateCartUI();
        updatePlanDisplay();
    } catch (e) { sessionStorage.removeItem("selectedPlan"); }
}

function initMembershipPage() {
    renderPlans();
    loadSavedPlan();
    listenToPlanChanges();

    if (!document.querySelector("#animationStyles")) {
        const s = document.createElement("style");
        s.id = "animationStyles";
        s.textContent = `
            @keyframes slideIn  { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
            @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(100%);opacity:0} }`;
        document.head.appendChild(s);
    }

    const ids = ["fullname", "email", "phone", "dob"];
    const fns = [validateFullName, validateEmailMembership, validatePhone, validateDOB];
    ids.forEach((id, i) => document.getElementById(id)?.addEventListener("blur", fns[i]));

    document.getElementById("termsCheckbox")?.addEventListener("change", validateTerms);

    const form = document.getElementById("registrationForm");
    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            if (validateMembershipForm()) {
                showSuccessMessage(document.getElementById("email").value);
                resetMembershipForm();
            } else {
                showNotification("Please fix the errors before submitting", "error");
            }
        });
    }
}

// ========== 6. صفحة الاتصال ==========

function saveContactMessage(data) {
    if (window.StorageAPI) {
        window.StorageAPI.saveContactMessage(data);
    } else {
        // Fallback للتوافق
        let msgs = [];
        try { msgs = JSON.parse(localStorage.getItem("contactMessages")) || []; } catch (e) { }
        msgs.unshift({ ...data, id: Date.now(), timestamp: new Date().toLocaleString(), date: new Date().toISOString(), read: false });
        localStorage.setItem("contactMessages", JSON.stringify(msgs));
    }
}

function displayStoredMessages() {
    const list = document.getElementById("messagesList");
    const section = document.getElementById("adminSection");
    if (!list || !section) return;

    let msgs = [];
    if (window.StorageAPI) {
        msgs = window.StorageAPI.getContactMessages();
    } else {
        try { msgs = JSON.parse(localStorage.getItem("contactMessages")) || []; } catch (e) { }
    }

    if (!msgs.length) {
        list.innerHTML = '<p style="text-align:center;color:#888">No messages yet</p>';
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    list.innerHTML = msgs.map(m => `
        <div class="message-item ${!m.read ? 'unread' : ''}" data-id="${m.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${escapeHtml(m.name)}</strong> 
                ${!m.read ? '<span class="unread-badge">NEW</span>' : ''}
            </div>
            <div>📧 ${escapeHtml(m.email)}</div>
            <div>📋 <strong>Subject:</strong> ${escapeHtml(m.subject)}</div>
            <div>💬 <strong>Message:</strong> ${escapeHtml(m.message)}</div>
            <div style="font-size:12px;color:#888;margin-top:5px;">📅 ${escapeHtml(m.timestamp)}</div>
        </div>`).join('');

    // إضافة زر مسح الكل محسن
    const clearBtn = document.getElementById("clearStorageBtn");
    if (clearBtn && msgs.length > 0) {
        clearBtn.style.display = "block";
    }
}

function validateContactName() {
    const el = document.getElementById("name"), err = document.getElementById("nameError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Name is required"; el.className = "error"; return false; }
    if (v.length < 2) { err.textContent = "Name must be at least 2 characters"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validateContactEmail() {
    const el = document.getElementById("email"), err = document.getElementById("emailError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Email is required"; el.className = "error"; return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = "Please enter a valid email"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validateSubject() {
    const el = document.getElementById("subject"), err = document.getElementById("subjectError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Subject is required"; el.className = "error"; return false; }
    if (v.length < 5) { err.textContent = "Subject must be at least 5 characters"; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function validateContactMessage() {
    const el = document.getElementById("message"), err = document.getElementById("messageError");
    if (!el || !err) return true;
    const v = el.value.trim();
    if (!v) { err.textContent = "Message is required"; el.className = "error"; return false; }
    if (v.length < 20) { err.textContent = `Message must be at least 20 characters (currently ${v.length})`; el.className = "error"; return false; }
    err.textContent = ""; el.className = "success"; return true;
}

function updateCharCounter() {
    const el = document.getElementById("message");
    const cnt = document.getElementById("charCounter");
    if (!el || !cnt) return;
    const len = el.value.length;
    cnt.textContent = `${len} / 20 characters minimum`;
    cnt.style.color = len >= 20 ? "#2ecc71" : len >= 15 ? "#f39c12" : "#e74c3c";
}

function clearContactStorage() {
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("contactMessages");
        displayStoredMessages();
        showNotification("All messages cleared!", "success");
    }
}

function validateContactForm() {
    return validateContactName() && validateContactEmail() && validateSubject() && validateContactMessage();
}

function resetContactForm() {
    const form = document.getElementById("contactForm");
    if (form) form.reset();
    document.querySelectorAll("#name,#email,#subject,#message").forEach(el => el?.classList.remove("success", "error"));
    updateCharCounter();
}

function initContactPage() {
    updateCharCounter();


    ["name", "email", "subject"].forEach(id => {
        const el = document.getElementById(id);
        const fn = { name: validateContactName, email: validateContactEmail, subject: validateSubject }[id];
        if (el && fn) { el.addEventListener("blur", fn); el.addEventListener("input", fn); }
    });

    const msgEl = document.getElementById("message");
    if (msgEl) {
        msgEl.addEventListener("blur", validateContactMessage);
        msgEl.addEventListener("input", () => { validateContactMessage(); updateCharCounter(); });
    }

    document.getElementById("clearStorageBtn")?.addEventListener("click", clearContactStorage);

    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            if (validateContactForm()) {
                saveContactMessage({
                    name: document.getElementById("name").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    subject: document.getElementById("subject").value.trim(),
                    message: document.getElementById("message").value.trim()
                });
                showNotification("✅ Message sent successfully! We'll contact you soon.", "success");
                resetContactForm();
            } else {
                showNotification("❌ Please fix the errors before submitting.", "error");
            }
        });
    }


}

// ========== 7. الصفحة الرئيسية ==========

// ✅ إصلاح تسرب setInterval
let _statsIntervalId = null;

function getMembers() { return window.StorageAPI ? window.StorageAPI.getMembersFull() : []; }
function getClasses() { return window.StorageAPI ? window.StorageAPI.getClassesFull() : []; }
function getPlans() { return window.StorageAPI ? window.StorageAPI.getPlansFull() : []; }

function updateLiveStats() {
    const members = getMembers();
    const classes = getClasses();

    const el = (id) => document.getElementById(id);
    if (el('totalMembers')) el('totalMembers').innerText = members.length;
    if (el('totalClasses')) el('totalClasses').innerText = classes.length;

    const counts = { Bronze: 0, Silver: 0, Gold: 0 };
    members.forEach(m => { if (counts[m.plan] !== undefined) counts[m.plan]++; });

    const emojis = { Bronze: "🥉", Silver: "🥈", Gold: "🥇" };
    let best = "None", max = 0;
    for (const [plan, count] of Object.entries(counts)) {
        if (count > max) { max = count; best = emojis[plan] + " " + plan; }
    }
    if (el('popularPlan')) el('popularPlan').innerText = best;
}

function loadDynamicPlans() {

    const plans = getPlans();
    const container = document.getElementById('dynamicPlans');
    if (!container) return;

    container.innerHTML = plans.map(plan => `
        <article class="card">
            <h3>${escapeHtml(plan.name)}</h3>
            <p><strong>${escapeHtml(plan.price)} / ${escapeHtml(plan.duration || 'Month')}</strong></p>
            <ul>
                ${plan.features.split(',').map(f => `<li>✓ ${escapeHtml(f.trim())}</li>`).join('')}
            </ul>
            <a href="membership.html" class="cta-btn">Choose Plan</a>
        </article>`).join('');
}

function initIndexPage() {
    if (!window.StorageAPI) {
        console.error('❌ StorageAPI غير موجود! تأكد من تحميل data-config.js أولاً');
        return;
    }

    updateLiveStats();
    loadDynamicPlans();

    window.addEventListener('storage', e => {
        if (['gym_members', 'gym_classes', 'gym_plans'].includes(e.key)) {
            updateLiveStats();
            loadDynamicPlans();
        }
    });

    // ✅ إصلاح تسرب الذاكرة: إيقاف القديم قبل إنشاء جديد
    if (_statsIntervalId) clearInterval(_statsIntervalId);
    _statsIntervalId = setInterval(() => {
        updateLiveStats();
        loadDynamicPlans();
    }, 5000);
}

// ========== 8. تهيئة الصفحات ==========

document.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname.split("/").pop();

    // ✅ استدعاء دالة القائمة المتنقلة
    initMobileNavigation();

    switch (page) {
        case "classes.html": initClassesPage(); break;
        case "trainers.html": initTrainersPage(); break;
        case "membership.html": initMembershipPage(); break;
        case "contact.html": initContactPage(); break;
        case "index.html":
        case "":
        case "/": initIndexPage(); break;
        default:
            if (document.getElementById("tableBody")) initClassesPage();
            else if (document.getElementById("trainers-info")) initTrainersPage();
            else if (document.getElementById("registrationForm")) initMembershipPage();
            else if (document.getElementById("contactForm")) initContactPage();
            else initIndexPage();
    }
});

// ========== 9. Mobile Navigation Toggle (Hamburger Menu) ==========
function initMobileNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!navToggle || !navLinks) return;
    
    navToggle.addEventListener('click', function() {
        navLinks.classList.toggle('open');
    });
    
    // إغلاق القائمة عند النقر على أي رابط
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });
}