// ========================================
// 1. التحقق من StorageAPI عند التحميل
// ========================================

if (!window.StorageAPI) {
    console.error('❌ StorageAPI غير موجود! تأكد من تحميل data-config.js أولاً');
}

// ========================================
// 2. بيانات الاعتماد (قابلة للاستبدال بـ JWT)
// ========================================

const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// دالة التحقق - يمكن استبدالها لاحقاً بـ JWT/API
function validateCredentials(username, password) {
    return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

// ========================================
// 3. دوال مساعدة عامة
// ========================================

function escapeHtml(str) {
    return window.StorageAPI ? window.StorageAPI.escapeHtml(str) : String(str || '');
}

function checkAuth() {
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

function logout() {
    if (confirm('⚠️ Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'admin-login.html';
    }
}

// دالة الإشعارات الموحدة (تستخدم CSS classes من admin.css)
function showNotification(message, type = "success") {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `${icon} ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut .3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// showToast alias للتوافق مع الكود القديم
function showToast(message, type = "success") {
    showNotification(message, type);
}

// دوال التحميل (loading states)
function showLoading(msg = 'Loading...') {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `<div class="loading-spinner">${msg}</div>`;
        document.body.appendChild(overlay);
    }
    overlay.querySelector('.loading-spinner').textContent = msg;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function getPlanEmoji(plan) {
    return { Bronze: "🥉", Silver: "🥈", Gold: "🥇" }[plan] || "";
}

function getDifficultyText(level) {
    return {
        "Beginner": "🟢 Beginner",
        "Intermediate": "🟡 Intermediate",
        "Advanced": "🔴 Advanced",
        "All Levels": "🟣 All Levels"
    }[level] || level;
}

// ========================================
// 4. دوال التخزين (تُفوَّض لـ StorageAPI)
// ========================================

function getData(key) {
    if (window.StorageAPI) return window.StorageAPI.getData(key);
    console.error('StorageAPI غير موجود');
    return [];
}

function setData(key, data) {
    if (window.StorageAPI) {
        window.StorageAPI.setData(key, data);
    } else {
        console.error('StorageAPI غير موجود');
    }
}

function updateDashboardStats() {
    const members = getData('MEMBERS');
    const classes = getData('CLASSES');
    const counts = { Bronze: 0, Silver: 0, Gold: 0 };
    members.forEach(m => { if (counts[m.plan] !== undefined) counts[m.plan]++; });

    let best = 'None', max = 0;
    for (const [plan, count] of Object.entries(counts)) {
        if (count > max) { max = count; best = plan; }
    }

    setData('STATS', {
        totalMembers: members.length,
        activeSubscriptions: members.length,
        classesPerWeek: classes.length,
        mostPopularPlan: best,
        bronzeCount: counts.Bronze,
        silverCount: counts.Silver,
        goldCount: counts.Gold,
        lastUpdated: new Date().toISOString()
    });
}

// ========================================
// 5. صفحة تسجيل الدخول
// ========================================

const LoginPage = {
    init() {
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        document.getElementById('loginForm')?.addEventListener('submit', e => this.handleLogin(e));
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');

        if (validateCredentials(username, password)) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            window.location.href = 'admin-dashboard.html';
        } else {
            errorMsg?.classList.add('show');
            document.getElementById('password').value = '';
            setTimeout(() => errorMsg?.classList.remove('show'), 3000);
        }
    }
};

// ========================================
// 6. صفحة لوحة التحكم
// ========================================

const DashboardPage = {
    members: [],
    classes: [],
    _intervalId: null,  // ✅ تتبع الـ interval لمنع التسرب

    init() {
        if (!checkAuth()) return;
        this.setAdminName();
        this.loadData();
        this.bindEvents();
        this.render();

        // ✅ إصلاح تسرب الذاكرة
        if (this._intervalId) clearInterval(this._intervalId);
        this._intervalId = setInterval(() => this.render(), 5000);
    },

    setAdminName() {
        const el = document.getElementById('adminName');
        if (el) el.innerText = sessionStorage.getItem('adminUsername') || 'Admin';
    },

    loadData() {
        this.members = getData('MEMBERS');
        this.classes = getData('CLASSES');
    },

    bindEvents() {
        window.addEventListener('storage', () => { this.loadData(); this.render(); });
        document.querySelector('.stats-grid')?.addEventListener('click', e => {
            const card = e.target.closest('.stat-card[data-href]');
            if (card) window.location.href = card.dataset.href;
        });
    },

    render() {
        this.loadData();
        this.updateStatsCards();
        this.renderBarChart();
        this.renderRecentMembers();
    },

    updateStatsCards() {
        const bronze = this.members.filter(m => m.plan === "Bronze").length;
        const silver = this.members.filter(m => m.plan === "Silver").length;
        const gold = this.members.filter(m => m.plan === "Gold").length;

        let best = "None", max = 0;
        if (bronze > max) { max = bronze; best = "🥉 Bronze"; }
        if (silver > max) { max = silver; best = "🥈 Silver"; }
        if (gold > max) { max = gold; best = "🥇 Gold"; }

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
        set("totalMembers", this.members.length);
        set("activeSubs", this.members.length);
        set("classesPerWeek", this.classes.length);
        set("popularPlan", best);
    },

    renderBarChart() {
        const bronze = this.members.filter(m => m.plan === "Bronze").length;
        const silver = this.members.filter(m => m.plan === "Silver").length;
        const gold = this.members.filter(m => m.plan === "Gold").length;
        const max = Math.max(bronze, silver, gold, 1);
        const chart = document.getElementById("barChart");
        if (!chart) return;

        chart.innerHTML = [
            { name: "Bronze", count: bronze, color: "bronze-bar", emoji: "🥉" },
            { name: "Silver", count: silver, color: "silver-bar", emoji: "🥈" },
            { name: "Gold", count: gold, color: "gold-bar", emoji: "🥇" }
        ].map(bar => {
            const h = bar.count === 0 ? 10 : (bar.count / max) * 180;
            return `<div class="bar-item">
                <div class="bar ${bar.color}" style="height:${h}px;width:60px">
                    <div class="bar-value" style="position:relative;top:-25px">${bar.count}</div>
                </div>
                <div class="bar-label">${bar.emoji} ${bar.name}</div>
            </div>`;
        }).join("");
    },

    renderRecentMembers() {
        const recent = [...this.members]
            .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
            .slice(0, 5);
        const tbody = document.getElementById("recentMembers");
        if (!tbody) return;
        tbody.innerHTML = recent.length
            ? recent.map(m => `
                <tr>
                    <td>${escapeHtml(m.name)}</td>
                    <td>${escapeHtml(m.email)}</td>
                    <td>${escapeHtml(m.plan)}${getPlanEmoji(m.plan)}</td>
                    <td>${escapeHtml(m.joinDate)}</td>
                </tr>`).join('')
            : '<tr><td colspan="4">No members yet</td></tr>';
    }
};

// ========================================
// 7. صفحة إدارة الأعضاء
// ========================================

const MembersPage = {
    members: [],
    editId: null,

    init() {
        if (!checkAuth()) return;
        this.loadData();
        this.bindEvents();
        this.render();
    },

    loadData() {
        this.members = getData('MEMBERS');
    },

    bindEvents() {
        document.getElementById('memberForm')?.addEventListener('submit', e => this.addMember(e));
        document.getElementById('search')?.addEventListener('input', () => this.render());
        document.getElementById('planFilter')?.addEventListener('change', () => this.render());
        document.getElementById('tableBody')?.addEventListener('click', e => this.handleTableClick(e));
        document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('closeEditModal')?.addEventListener('click', () => this.closeModal());
        window.addEventListener('storage', () => { this.loadData(); this.render(); });
        window.addEventListener('click', e => { if (e.target === document.getElementById('editModal')) this.closeModal(); });
    },

    handleTableClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('edit')) this.openEditModal(id);
        if (btn.classList.contains('delete')) this.deleteMember(id);
    },

    addMember(e) {
        e.preventDefault();
        const newMember = {
            id: Date.now(),
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            plan: document.getElementById("plan").value,
            joinDate: document.getElementById("joinDate").value || new Date().toISOString().split('T')[0]
        };

        if (!newMember.name || !newMember.email) {
            showNotification("Please fill in all required fields!", "error");
            return;
        }

        this.members.push(newMember);
        this.save();
        this.render();
        e.target.reset();
        showNotification(`✅ Member "${newMember.name}" added successfully!`);
    },

    deleteMember(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;
        if (confirm(`⚠️ Are you sure you want to delete "${member.name}"?`)) {
            this.members = this.members.filter(m => m.id !== id);
            this.save();
            this.render();
            showNotification(`🗑️ Member "${member.name}" deleted!`, 'error');
        }
    },

    openEditModal(id) {
        const m = this.members.find(m => m.id === id);
        if (!m) return;
        this.editId = id;
        document.getElementById("editName").value = m.name;
        document.getElementById("editEmail").value = m.email;
        document.getElementById("editPhone").value = m.phone;
        document.getElementById("editPlan").value = m.plan;
        document.getElementById("editJoinDate").value = m.joinDate;
        document.getElementById("editModal").style.display = "flex";
    },

    saveEdit() {
        const idx = this.members.findIndex(m => m.id === this.editId);
        if (idx !== -1) {
            this.members[idx] = {
                ...this.members[idx],
                name: document.getElementById("editName").value.trim(),
                email: document.getElementById("editEmail").value.trim(),
                phone: document.getElementById("editPhone").value.trim(),
                plan: document.getElementById("editPlan").value,
                joinDate: document.getElementById("editJoinDate").value
            };
            this.save();
            this.render();
            showNotification("✅ Member updated successfully!");
        }
        this.closeModal();
    },

    closeModal() {
        document.getElementById("editModal").style.display = "none";
        this.editId = null;
    },

    render() {
        let data = [...this.members];
        const term = document.getElementById("search")?.value.toLowerCase() || "";
        const filter = document.getElementById("planFilter")?.value || "All";

        if (term) data = data.filter(m => m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term));
        if (filter !== "All") data = data.filter(m => m.plan === filter);

        const tbody = document.getElementById("tableBody");
        const countEl = document.getElementById("count");
        if (!tbody) return;

        tbody.innerHTML = data.length
            ? data.map(m => `
                <tr>
                    <td>${escapeHtml(m.name)}</td>
                    <td>${escapeHtml(m.email)}</td>
                    <td>${escapeHtml(m.phone)}</td>
                    <td>${getPlanEmoji(m.plan)} ${escapeHtml(m.plan)}</td>
                    <td>${escapeHtml(m.joinDate)}</td>
                    <td>
                        <button class="edit" data-id="${m.id}">✏️ Edit</button>
                        <button class="delete" data-id="${m.id}">🗑️ Delete</button>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="6" class="text-center">No members found</td></tr>';

        if (countEl) countEl.innerText = data.length;
    },

    save() {
        setData('MEMBERS', this.members);
        updateDashboardStats();
    }
};

// ========================================
// 8. صفحة إدارة الحصص
// ========================================

const ClassesPage = {
    classes: [],
    editId: null,

    init() {
        if (!checkAuth()) return;
        this.loadData();
        this.bindEvents();
        this.render();
    },

    loadData() {
        this.classes = getData('CLASSES');
    },

    bindEvents() {
        document.getElementById('classForm')?.addEventListener('submit', e => this.addClass(e));
        document.getElementById('tableBody')?.addEventListener('click', e => this.handleTableClick(e));
        document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('closeEditModal')?.addEventListener('click', () => this.closeModal());
        window.addEventListener('storage', () => { this.loadData(); this.render(); });
        window.addEventListener('click', e => { if (e.target === document.getElementById('editModal')) this.closeModal(); });
    },

    handleTableClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('edit')) this.openEditModal(id);
        if (btn.classList.contains('delete')) this.deleteClass(id);
    },

    isDuplicate(trainer, day, time, excludeId = null) {
        return this.classes.some(c =>
            c.trainer === trainer && c.day === day && c.time === time && c.id !== excludeId
        );
    },

    addClass(e) {
        e.preventDefault();
        const trainer = document.getElementById("trainer").value;
        const day = document.getElementById("day").value;
        const time = document.getElementById("time").value;

        if (this.isDuplicate(trainer, day, time)) {
            showNotification("❌ Duplicate! Same trainer cannot teach at the same day and time.", 'error');
            return;
        }

        const newClass = {
            id: Date.now(),
            name: document.getElementById("name").value.trim(),
            trainer,
            day,
            time,
            duration: parseInt(document.getElementById("duration").value),
            difficulty: document.getElementById("difficulty").value,
            capacity: parseInt(document.getElementById("capacity").value)
        };

        this.classes.push(newClass);
        this.save();
        this.render();
        e.target.reset();
        showNotification(`✅ Class "${newClass.name}" added successfully!`);
    },

    deleteClass(id) {
        const item = this.classes.find(c => c.id === id);
        if (!item) return;
        if (confirm(`⚠️ Are you sure you want to delete "${item.name}"?`)) {
            this.classes = this.classes.filter(c => c.id !== id);
            this.save();
            this.render();
            showNotification(`🗑️ Class "${item.name}" deleted!`, 'error');
        }
    },

    openEditModal(id) {
        const c = this.classes.find(c => c.id === id);
        if (!c) return;
        this.editId = id;
        document.getElementById("editName").value = c.name;
        document.getElementById("editTrainer").value = c.trainer;
        document.getElementById("editDay").value = c.day;
        document.getElementById("editTime").value = c.time;
        document.getElementById("editDuration").value = c.duration;
        document.getElementById("editDifficulty").value = c.difficulty;
        document.getElementById("editCapacity").value = c.capacity;
        document.getElementById("editModal").style.display = "flex";
    },

    saveEdit() {
        const trainer = document.getElementById("editTrainer").value;
        const day = document.getElementById("editDay").value;
        const time = document.getElementById("editTime").value;

        if (this.isDuplicate(trainer, day, time, this.editId)) {
            showNotification("❌ Duplicate! Same trainer cannot teach at the same day and time.", 'error');
            return;
        }

        const idx = this.classes.findIndex(c => c.id === this.editId);
        if (idx !== -1) {
            this.classes[idx] = {
                ...this.classes[idx],
                name: document.getElementById("editName").value.trim(),
                trainer,
                day,
                time,
                duration: parseInt(document.getElementById("editDuration").value),
                difficulty: document.getElementById("editDifficulty").value,
                capacity: parseInt(document.getElementById("editCapacity").value)
            };
            this.save();
            this.render();
            showNotification("✅ Class updated successfully!");
        }
        this.closeModal();
    },

    closeModal() {
        document.getElementById("editModal").style.display = "none";
        this.editId = null;
    },

    render() {
        const tbody = document.getElementById("tableBody");
        if (!tbody) return;

        tbody.innerHTML = this.classes.length
            ? this.classes.map(c => `
                <tr>
                    <td>${escapeHtml(c.name)}</td>
                    <td>${escapeHtml(c.trainer)}</td>
                    <td>${escapeHtml(c.day)}</td>
                    <td>${escapeHtml(c.time)}</td>
                    <td>${escapeHtml(c.duration)} min</td>
                    <td><span class="difficulty-badge ${c.difficulty.toLowerCase().replace(' ', '-')}">${getDifficultyText(c.difficulty)}</span></td>
                    <td>${escapeHtml(c.capacity)}</td>
                    <td>
                        <button class="edit" data-id="${c.id}">✏️ Edit</button>
                        <button class="delete" data-id="${c.id}">🗑️ Delete</button>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="8" class="text-center">No classes found</td></tr>';
    },

    save() {
        setData('CLASSES', this.classes);
        updateDashboardStats();
    }
};

// ========================================
// 9. صفحة إدارة الخطط
// ========================================

const PlansPage = {
    plans: [],
    editId: null,

    init() {
        if (!checkAuth()) return;
        this.loadData();
        this.bindEvents();
        this.render();
    },

    loadData() {
        this.plans = getData('PLANS');
    },

    bindEvents() {
        document.getElementById('planForm')?.addEventListener('submit', e => this.addPlan(e));
        document.getElementById('tableBody')?.addEventListener('click', e => this.handleTableClick(e));
        document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('closeEditModal')?.addEventListener('click', () => this.closeModal());
        window.addEventListener('storage', () => { this.loadData(); this.render(); });
        window.addEventListener('click', e => { if (e.target === document.getElementById('editModal')) this.closeModal(); });
    },

    handleTableClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('edit-btn')) this.openEditModal(id);
        if (btn.classList.contains('delete-btn')) this.deletePlan(id);
    },

    addPlan(e) {
        e.preventDefault();
        const name = document.getElementById('planName').value.trim();
        const price = document.getElementById('price').value.trim();
        const duration = document.getElementById('duration').value.trim();
        const features = document.getElementById('features').value.trim();

        if (!name || !price || !duration) {
            showNotification('Please fill in all required fields!', 'error');
            return;
        }

        const newPlan = {
            id: Date.now(),
            name,
            price: price + " DA",
            duration,
            features: features || "No features listed"
        };

        this.plans.push(newPlan);
        this.save();
        this.render();
        e.target.reset();
        showNotification(`✅ "${name}" plan added successfully!`);
    },

    deletePlan(id) {
        const plan = this.plans.find(p => p.id === id);
        if (!plan) return;
        if (confirm(`⚠️ Are you sure you want to delete "${plan.name}" plan?`)) {
            this.plans = this.plans.filter(p => p.id !== id);
            this.save();
            this.render();
            showNotification(`🗑️ "${plan.name}" plan deleted!`, 'error');
        }
    },

    openEditModal(id) {
        const plan = this.plans.find(p => p.id === id);
        if (!plan) return;
        this.editId = id;
        document.getElementById('editPlanName').value = plan.name;
        document.getElementById('editPrice').value = plan.price.replace(' DA', '');
        document.getElementById('editDuration').value = plan.duration;
        document.getElementById('editFeatures').value = plan.features;
        document.getElementById('editModal').style.display = 'flex';
    },

    saveEdit() {
        const idx = this.plans.findIndex(p => p.id === this.editId);
        if (idx !== -1) {
            this.plans[idx] = {
                ...this.plans[idx],
                name: document.getElementById('editPlanName').value.trim(),
                price: document.getElementById('editPrice').value.trim() + " DA",
                duration: document.getElementById('editDuration').value.trim(),
                features: document.getElementById('editFeatures').value.trim()
            };
            this.save();
            this.render();
            showNotification("✅ Plan updated successfully!");
        }
        this.closeModal();
    },

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editId = null;
    },

    render() {
        const tbody = document.getElementById('tableBody');
        const countEl = document.getElementById('plansCount');

        if (countEl) countEl.innerHTML = `📊 Total Plans: ${this.plans.length}`;
        if (!tbody) return;

        tbody.innerHTML = this.plans.length
            ? this.plans.map(plan => `
                <tr>
                    <td><strong>${escapeHtml(plan.name)}</strong></td>
                    <td>${escapeHtml(plan.price)}</td>
                    <td>${escapeHtml(plan.duration)}</td>
                    <td>${escapeHtml(plan.features)}</td>
                    <td>
                        <button class="edit-btn" data-id="${plan.id}">✏️ Edit</button>
                        <button class="delete-btn" data-id="${plan.id}">🗑️ Delete</button>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="5" class="text-center">📭 No plans available</td></tr>';
    },

    save() {
        setData('PLANS', this.plans);
        updateDashboardStats();
    }
};


// ========================================
// 10. صفحة إدارة الرسائل (Messages Page)
// ========================================

const MessagesPage = {
    messages: [],
    refreshInterval: null,

    init() {
        if (!checkAuth()) return;
        this.setAdminName();
        this.loadMessages();
        this.bindEvents();
        this.refreshInterval = setInterval(() => this.loadMessages(), 5000);
    },

    setAdminName() {
        const el = document.getElementById('adminName');
        if (el) el.innerText = sessionStorage.getItem('adminUsername') || 'Admin';
    },

    loadMessages() {
        this.messages = window.StorageAPI ? window.StorageAPI.getContactMessages() : [];
        this.messages.sort((a, b) => b.id - a.id);
        this.render();
    },

    saveMessages() {
        if (window.StorageAPI && window.StorageAPI.setData) {
            window.StorageAPI.setData('CONTACT', this.messages);
        } else {
            localStorage.setItem('contactMessages', JSON.stringify(this.messages));
        }
    },

    markAsRead(id) {
        const msg = this.messages.find(m => m.id === id);
        if (msg && !msg.read) {
            msg.read = true;
            this.saveMessages();
            this.loadMessages();
            showToast('✅ Marked as read', 'success');
        }
    },

    deleteMessage(id) {
        const msg = this.messages.find(m => m.id === id);
        if (msg && confirm(`Delete message from "${msg.name}"?`)) {
            this.messages = this.messages.filter(m => m.id !== id);
            this.saveMessages();
            this.loadMessages();
            showToast('🗑️ Message deleted', 'error');
        }
    },

    deleteAllMessages() {
        if (this.messages.length && confirm(`Delete ALL ${this.messages.length} messages?`)) {
            this.messages = [];
            this.saveMessages();
            this.loadMessages();
            showToast('🗑️ All messages deleted', 'error');
        }
    },

    bindEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'contactMessages') this.loadMessages();
        });
        document.getElementById('messagesContainer')?.addEventListener('click', e => this.handleMessageClick(e));
    },

    handleMessageClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('btn-mark-read')) this.markAsRead(id);
        if (btn.classList.contains('btn-delete') && !btn.id) this.deleteMessage(id);
        if (btn.id === 'deleteAllBtn') this.deleteAllMessages();
    },

    render() {
        const total = this.messages.length;
        const unread = this.messages.filter(m => !m.read).length;

        const totalEl = document.getElementById('totalMessages');
        const unreadEl = document.getElementById('unreadMessages');
        if (totalEl) totalEl.innerText = total;
        if (unreadEl) unreadEl.innerText = unread;

        const container = document.getElementById('messagesContainer');
        if (!container) return;

        if (total === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No messages yet</h3><p>Messages from contact form appear here</p></div>';
            return;
        }

        container.innerHTML = this.messages.map(msg => `
            <div class="message-card ${msg.read ? '' : 'unread'}">
                <div class="message-header">
                    <div class="message-sender">👤 ${escapeHtml(msg.name)} | 📧 ${escapeHtml(msg.email)}</div>
                    <div class="message-date">📅 ${escapeHtml(msg.timestamp)} ${!msg.read ? '<span class="unread-badge">NEW</span>' : ''}</div>
                </div>
                <div class="message-subject">📌 ${escapeHtml(msg.subject)}</div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
                <div class="message-actions">
                    ${!msg.read ? `<button class="btn-mark-read" data-id="${msg.id}">✓ Mark as Read</button>` : ''}
                    <button class="btn-delete" data-id="${msg.id}">🗑️ Delete</button>
                </div>
            </div>
        `).join('');

        // زر حذف الكل
        if (!document.getElementById('deleteAllBtn') && total > 0) {
            const btnDiv = document.createElement('div');
            btnDiv.className = 'text-center';
            btnDiv.style.marginTop = '15px';
            btnDiv.innerHTML = '<button id="deleteAllBtn" class="btn-delete">🗑️ Delete All Messages</button>';
            container.parentElement?.appendChild(btnDiv);
        }
    }
};

 

// ========================================
// 10. تهيئة الصفحات
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();

    switch (page) {
        case 'admin-login.html': LoginPage.init(); break;
        case 'admin-dashboard.html': DashboardPage.init(); break;
        case 'admin-members.html':
            window.membersPage = MembersPage;
            MembersPage.init();
            break;
        case 'admin-classes.html':
            window.classesPage = ClassesPage;
            ClassesPage.init();
            break;
        case 'admin-plans.html':
            window.plansPage = PlansPage;
            PlansPage.init();
            break;
        case 'admin-messages.html':   
            window.messagesPage = MessagesPage;
            MessagesPage.init();
            break;
        default:
            if (document.querySelector('.admin-layout')) {
                if (document.querySelector('#memberForm')) { window.membersPage = MembersPage; MembersPage.init(); }
                else if (document.querySelector('#classForm')) { window.classesPage = ClassesPage; ClassesPage.init(); }
                else if (document.querySelector('#planForm')) { window.plansPage = PlansPage; PlansPage.init(); }
                else if (document.querySelector('#memberForm, #classForm, #planForm')) { }
                else if (document.querySelector('#messagesContainer')) {  // ✅ إضافة شرط الرسائل
                    window.messagesPage = MessagesPage;
                    MessagesPage.init();
                }
                else if (document.querySelector('.stats-grid')) DashboardPage.init();
            }
    }
});

// ========================================
// 11. إعدادات عامة بعد تحميل الصفحة
// ========================================

// مستمع عام لزر تسجيل الخروج
document.addEventListener('click', function (e) {
    const btn = e.target.closest('#logoutBtn, .logout-link');
    if (btn) logout();
});

// تصدير الدوال العامة
window.logout = logout;
window.showToast = showToast;
window.saveEdit = function () {
    if (window.plansPage && document.getElementById('editPlanName')) { window.plansPage.saveEdit(); return; }
    if (window.classesPage && document.getElementById('editTrainer')) { window.classesPage.saveEdit(); return; }
    if (window.membersPage && document.getElementById('editName')) { window.membersPage.saveEdit(); return; }
};
window.closeModal = function () {
    window.membersPage?.closeModal();
    window.classesPage?.closeModal();
    window.plansPage?.closeModal();
};