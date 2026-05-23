// ========================
// 1. البيانات الأساسية والتخزين
// ========================
console.log("تم تحميل app.js بنجاح");
let currentPage = 'login';
let loggedUser = null;

// بيانات الأقراص
let drives = [
    { name: "القرص C:", total: 237, used: 212, icon: "💿" },
    { name: "القرص D:", total: 512, used: 340, icon: "💾" },
    { name: "القرص E:", total: 1000, used: 390, icon: "📀" },
    { name: "القرص F:", total: 256, used: 98, icon: "⚡" }
];

// بيانات النظام
let systemStats = {
    cpu: 41,
    ramUsed: 7.8,
    ramTotal: 16,
    temp: 50,
    battery: 70,
    charging: true
};

// تهيئة المستخدمين
if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify([
        { username: "admin", password: "123", role: "admin", email: "admin@erterqa.com", lastLogin: null },
        { username: "mohandis", password: "123", role: "user", email: "mohandis@erterqa.com", lastLogin: null }
    ]));
}

// ========================
// 2. دوال مساعدة
// ========================
function getPercentage(used, total) { return (used / total) * 100; }

function getLedColor(percent) {
    if (percent >= 85) return "#e74c3c";
    if (percent >= 50) return "#f39c12";
    return "#2ecc71";
}

function getProgressColor(percent) {
    if (percent >= 85) return "#e74c3c";
    if (percent >= 50) return "#f39c12";
    return "#2ecc71";
}

// تحديث البطارية الحقيقية
async function updateRealBattery() {
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            systemStats.battery = Math.floor(battery.level * 100);
            systemStats.charging = battery.charging;
            const fillElem = document.getElementById("realBatteryFill");
            const percentElem = document.getElementById("realBatteryPercent");
            const statusElem = document.getElementById("realBatteryStatus");
            if (fillElem) fillElem.style.width = `${systemStats.battery}%`;
            if (percentElem) percentElem.innerHTML = `${systemStats.battery}%`;
            if (statusElem) statusElem.innerHTML = systemStats.charging ? "🔌 موصول بالشاحن" : "🔋 يعمل على البطارية";
        } catch(e) { console.warn("خطأ في البطارية:", e); }
    }
}

// تحديث CPU و RAM
function updateSystemLoad() {
    if (performance && performance.now) {
        let start = performance.now();
        setTimeout(() => {
            let end = performance.now();
            let load = Math.min(95, Math.max(5, (end - start) * 2));
            systemStats.cpu = Math.floor(load);
        }, 50);
    } else {
        systemStats.cpu = Math.floor(Math.random() * 50 + 10);
    }
    if (performance.memory) {
        let used = (performance.memory.usedJSHeapSize / (1024 * 1024 * 1024)).toFixed(1);
        systemStats.ramUsed = Math.min(parseFloat(used), systemStats.ramTotal - 0.5);
    } else {
        systemStats.ramUsed = parseFloat((Math.random() * 10 + 2).toFixed(1));
    }
}

// تحديث جميع البيانات
function refreshAllData() {
    drives.forEach(d => {
        let change = (Math.random() * 12) - 4;
        let newUsed = d.used + change;
        if (newUsed < 5) newUsed = 5;
        if (newUsed > d.total - 2) newUsed = d.total - 2;
        d.used = parseFloat(newUsed.toFixed(1));
    });
    systemStats.cpu = Math.floor(Math.random() * 70) + 8;
    systemStats.ramUsed = parseFloat((Math.random() * 12 + 2).toFixed(1));
    systemStats.temp = Math.floor(Math.random() * 30) + 35;
    renderCurrentPage();
}

// ========================
// 3. دوال عرض الصفحات
// ========================
function renderLoginPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>🔐 تسجيل الدخول</h1>
                <input type="text" id="loginUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="password" id="loginPassword" placeholder="كلمة المرور" autocomplete="off">
                <button onclick="handleLogin()">دخول</button>
                <a href="#" onclick="navigateTo('register')" class="link">📝 ليس لديك حساب؟ سجل الآن</a>
                <a href="#" onclick="navigateTo('forgot')" class="link">🔑 نسيت كلمة المرور؟</a>
                <div id="loginError" class="error"></div>
            </div>
        </div>
    `;
}

function renderRegisterPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>📝 إنشاء حساب جديد</h1>
                <input type="text" id="regUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="email" id="regEmail" placeholder="البريد الإلكتروني" autocomplete="off">
                <input type="password" id="regPassword" placeholder="كلمة المرور" autocomplete="off">
                <input type="password" id="regConfirm" placeholder="تأكيد كلمة المرور" autocomplete="off">
                <button onclick="handleRegister()">تسجيل</button>
                <a href="#" onclick="navigateTo('login')" class="link">🔐 لديك حساب؟ سجل دخول</a>
                <div id="regMsg"></div>
            </div>
        </div>
    `;
}

function renderForgotPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>🔑 استعادة كلمة المرور</h1>
                <input type="text" id="forgotUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="email" id="forgotEmail" placeholder="البريد الإلكتروني" autocomplete="off">
                <input type="password" id="newPassword" placeholder="كلمة المرور الجديدة" autocomplete="off">
                <button onclick="handleForgot()">إعادة تعيين</button>
                <a href="#" onclick="navigateTo('login')" class="link">🔐 تذكرت كلمة المرور؟ سجل دخول</a>
                <div id="forgotMsg"></div>
            </div>
        </div>
    `;
}

function renderSidebar() {
    if (!loggedUser) return '';
    return `
        <div class="sidebar">
            <div class="logo-sidebar">
                <img src="logo1.png" class="sidebar-logo" onerror="this.style.display='none'">
                <div class="sidebar-slogan">حقوق الطبع محفوظة لدى شركة الإرتقاء سوفت 2026©</div>
            </div>
            <a href="#" onclick="navigateTo('index')">🏠 الرئيسية</a>
            <a href="#" onclick="navigateTo('dashboard')" style="background:#1f2f4f;">📀 لوحة التحكم</a>
            <a href="#" onclick="navigateTo('stats')">📊 الإحصائيات</a>
            ${loggedUser.role === 'admin' ? '<a href="#" onclick="navigateTo(\'admin\')">👑 لوحة المدير</a>' : ''}
            <a href="#" onclick="navigateTo('device-info')">📟 معلومات الجهاز</a>
            <a href="#" onclick="logout()">🚪 تسجيل الخروج</a>
        </div>
    `;
}

function renderTopBar() {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: #0f1420cc; padding: 12px 25px; border-radius: 60px;">
            <div><h2 style="margin: 0;">🖥️ ERTIQA SOFT</h2></div>
            <div class="user-menu" style="position: relative; display: inline-block;">
                <div style="background: #1f2f4f; border-radius: 40px; padding: 8px 18px; display: flex; gap: 10px; cursor: pointer;" onclick="toggleUserMenu()">
                    <span>👤</span>
                    <span id="topUsername">${loggedUser?.username || ''}</span>
                    <span>▼</span>
                </div>
                <div id="userDropdown" style="display: none; position: absolute; left: 0; top: 45px; background: #11161f; min-width: 180px; border-radius: 20px; border: 1px solid #2a3a55; z-index: 100;">
                    <a href="#" onclick="showUserData(); return false;" style="color: #eef2ff; padding: 12px 18px; text-decoration: none; display: block;">📋 بيانات المستخدم</a>
                    <a href="#" onclick="logout(); return false;" style="color: #eef2ff; padding: 12px 18px; text-decoration: none; display: block;">🚪 تسجيل الخروج</a>
                </div>
            </div>
        </div>
    `;
}
function renderIndexPage() {
    return `
        ${renderTopBar()}
       
            <h1>الارتقاء سوفت</h1>
            <p>أفضل دعم لتكنولوجيا المعلومات لنجاح الأعمال</p>
        </div>
        <div class="section">
            <h2>🌟 من نحن</h2>
            <p>الارتقاء سوفت للأنظمة والبرمجيات هي شركة يمنية متخصصة في تقديم حلول تقنية متكاملة للأفراد والشركات</p>
        </div>
          <div class="section">
        <h2>📋 خدماتنا</h2>
        <div class="cards">
            <div class="card">💻 برمجيات مخصصة</div>
            <div class="card">🌐 تطوير الويب</div>
            <div class="card">📱 تطبيقات الجوال</div>
            <div class="card">☁️ حلول سحابية</div>
        </div>
    </div>
    `;
}

function renderDashboardPage() {
    // حساب نسب الأقراص
    let drivesHtml = '';
    drives.forEach(d => {
        const percent = getPercentage(d.used, d.total).toFixed(1);
        const free = (d.total - d.used).toFixed(1);
        const ledColor = getLedColor(percent);
        
        drivesHtml += `
            <div class="drive-card">
                <div class="drive-header">
                    <span class="drive-name">${d.name}</span>
                    <div class="led-indicator" style="background: ${ledColor}; box-shadow: 0 0 6px ${ledColor};"></div>
                </div>
                <div class="drive-stats">
                    <div>🆓 حر: ${free} GB</div>
                    <div>💾 مستخدم: ${d.used} GB</div>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill" style="width: ${percent}%; background: ${ledColor};"></div>
                </div>
                <div class="drive-percent">نسبة الإشغال: ${percent}%</div>
            </div>
        `;
    });

    // مؤشرات الحالة (نشط - تحذير - حرج)
   const statusIndicators = `
    <div class="status-indicators">
        <div class="status-badge"><span class="status-led green"></span><span class="status-text-green">نشط</span><span class="status-hint">&lt;50%</span></div>
        <div class="status-badge"><span class="status-led orange"></span><span class="status-text-orange">تحذير</span><span class="status-hint">50%-85%</span></div>
        <div class="status-badge"><span class="status-led red"></span><span class="status-text-red">حرج</span><span class="status-hint">&gt;85%</span></div>
    </div>
`;

    // موارد النظام
    const cpuPercent = systemStats.cpu;
    const ramPercent = (systemStats.ramUsed / systemStats.ramTotal) * 100;
    const tempColor = systemStats.temp <= 50 ? "#2ecc71" : (systemStats.temp <= 70 ? "#f39c12" : "#e74c3c");
    const tempText = systemStats.temp <= 50 ? "ممتاز" : (systemStats.temp <= 70 ? "معتدل" : "مرتفع");
    const batteryColor = systemStats.battery > 60 ? "#2ecc71" : (systemStats.battery > 25 ? "#f39c12" : "#e74c3c");

    return `
        ${renderTopBar()}
        <h1>🖥️ لوحة تحكم النظام الذكية</h1>
        <p>حالة الأجهزة والموارد</p>
        <div id="lastLoginInfo" style="font-size: 0.8rem; color: #7aa9ff; margin-top: 5px; margin-bottom: 15px;"></div>
        ${statusIndicators}
        <div class="section-title">💿 وحدات التخزين (الأقراص)</div>
        <div class="cards-grid drives-grid">${drivesHtml}</div>

        <div class="section-title">⚙️ أداء النظام الحي</div>
        <div class="cards-grid resources-grid">
            <div class="resource-card">
                <div class="resource-title">🧠 المعالج CPU</div>
                <div class="value-big">${cpuPercent}%</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${cpuPercent}%; background: #3b6eff;"></div></div>
                <div class="resource-sub">⚡ التردد: 3.6 جيجاهرتز</div>
            </div>
            <div class="resource-card">
                <div class="resource-title">📀 الذاكرة RAM</div>
                <div class="value-big">${systemStats.ramUsed} / ${systemStats.ramTotal} GB</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${ramPercent}%; background: #9b59b6;"></div></div>
                <div class="resource-sub">📌 النسبة: ${Math.floor(ramPercent)}%</div>
            </div>
            <div class="resource-card">
                <div class="resource-title">🌡️ الحرارة</div>
                <div class="value-big">${systemStats.temp}°C</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${systemStats.temp}%; background: ${tempColor};"></div></div>
                <div class="resource-sub">🔆 ${tempText}</div>
            </div>
            <div class="resource-card">
                <div class="resource-title">🔋 البطارية</div>
                <div class="value-big">${systemStats.battery}%</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${systemStats.battery}%; background: ${batteryColor};"></div></div>
                <div class="resource-sub">${systemStats.charging ? "🔌 موصول بالشاحن" : "🔋 يعمل على البطارية"}</div>
            </div>
        </div>

        <div style="display: flex; justify-content: center; margin: 30px 0;">
            <button onclick="refreshAllData()">⟳ تحديث شامل للبيانات</button>
        </div>
        <footer>⚡ بيانات تفاعلية – لوحة تحكم احترافية | الارتقاء سوفت</footer>
    `;
}

function renderStatsPage() {
    // حساب إحصائيات الأقراص
    let totalSpace = 0;
    let totalUsed = 0;
    drives.forEach(d => {
        totalSpace += d.total;
        totalUsed += d.used;
    });
    const totalFree = totalSpace - totalUsed;
    const usedPercent = ((totalUsed / totalSpace) * 100).toFixed(1);

    // إحصائيات النظام
    const cpuPercent = systemStats.cpu;
    const ramPercent = (systemStats.ramUsed / systemStats.ramTotal) * 100;

    return `
        ${renderTopBar()}
        <h1>📊 لوحة الإحصائيات المتقدمة</h1>
        <p>مرحباً | هنا تراقب الأداء والعمليات والإنترنت</p>

        <!-- الرسوم البيانية -->
        <div class="stats-grid">
            <div class="stats-card">
                <h3>🧠 استخدام CPU</h3>
                <canvas id="cpuChart" width="400" height="200" style="max-width:100%; height:auto;"></canvas>
                <div class="stats-value">الاستخدام الحالي: ${cpuPercent}%</div>
            </div>
            <div class="stats-card">
                <h3>📀 استخدام RAM</h3>
                <canvas id="ramChart" width="400" height="200" style="max-width:100%; height:auto;"></canvas>
                <div class="stats-value">${systemStats.ramUsed} / ${systemStats.ramTotal} GB (${Math.floor(ramPercent)}%)</div>
            </div>
        </div>

        <!-- إحصائيات الأقراص -->
        <div class="stats-section">
            <h2>💿 إحصائيات التخزين</h2>
            <div class="stats-grid">
                <div class="stats-card">
                    <h3>📀 إجمالي المساحة</h3>
                    <div class="stats-number">${totalSpace} GB</div>
                </div>
                <div class="stats-card">
                    <h3>💾 المستخدم</h3>
                    <div class="stats-number">${totalUsed} GB</div>
                </div>
                <div class="stats-card">
                    <h3>🆓 الحر</h3>
                    <div class="stats-number">${totalFree} GB</div>
                </div>
                <div class="stats-card">
                    <h3>📊 نسبة الإشغال</h3>
                    <div class="stats-number">${usedPercent}%</div>
                    <div class="progress-bar-bg"><div class="progress-fill" style="width: ${usedPercent}%; background: #3b6eff;"></div></div>
                </div>
            </div>
        </div>

        <!-- توزيع الأقراص -->
        <div class="stats-section">
            <h2>📀 توزيع الأقراص</h2>
            <div class="drives-stats-grid">
                ${drives.map(d => {
                    const percent = getPercentage(d.used, d.total).toFixed(1);
                    return `
                        <div class="drive-stats-card">
                            <h3>${d.name}</h3>
                            <div class="drive-stats-info">
                                <span>📀 ${d.total} GB</span>
                                <span>💾 ${d.used} GB</span>
                                <span>🆓 ${(d.total - d.used).toFixed(1)} GB</span>
                            </div>
                            <div class="progress-bar-bg"><div class="progress-fill" style="width: ${percent}%; background: ${getProgressColor(percent)};"></div></div>
                            <div>نسبة الإشغال: ${percent}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- بطارية -->
        <div class="stats-section">
            <h2>🔋 حالة البطارية</h2>
            <div class="stats-grid">
                <div class="stats-card">
                    <h3>نسبة الشحن</h3>
                    <div class="stats-number" id="statsBatteryPercent">-- %</div>
                    <div class="progress-bar-bg"><div class="progress-fill" id="statsBatteryFill" style="width: 0%; background: #2ecc71;"></div></div>
                    <div id="statsBatteryStatus">⏳ جاري التحميل...</div>
                </div>
            </div>
        </div>

        <footer>📊 تحديث تلقائي كل 5 ثواني | الارتقاء سوفت</footer>
    `;
}

function renderAdminPage() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const clients = JSON.parse(localStorage.getItem("clients")) || [];
    const sessions = JSON.parse(localStorage.getItem("sessions")) || [];

    // إحصائيات سريعة
    const stats = `
        <div class="admin-stats">
            <div class="admin-stat-card"><div class="admin-stat-number">${users.length}</div><div>👥 المستخدمين</div></div>
            <div class="admin-stat-card"><div class="admin-stat-number">${clients.length}</div><div>📋 العملاء</div></div>
            <div class="admin-stat-card"><div class="admin-stat-number">${sessions.length}</div><div>📊 الجلسات</div></div>
        </div>
    `;

    // قائمة المستخدمين المنسدلة (مع حالة النشاط)
    let usersTable = `
        <details class="admin-dropdown">
            <summary>👥 إدارة المستخدمين ▼</summary>
            <div class="dropdown-content-admin">
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead><tr><th>المستخدم</th><th>البريد</th><th>الصلاحية</th><th>الحالة</th><th>آخر دخول</th><th>حذف</th>
         </tr></thead>
         <tbody>
    `;
    
    users.forEach((user, idx) => {
        // حساب الحالة (نشط أو غير نشط)
        let statusHtml = "⚪ غير نشط";
        if (user.lastActive) {
            const last = new Date(user.lastActive);
            const now = new Date();
            const diffMinutes = (now - last) / (1000 * 60);
            if (diffMinutes < 5) {
                statusHtml = "🟢 نشط الآن";
            }
        }
        
        usersTable += `
            <tr>
                <td>${user.username}</td>
                <td>${user.email || '—'}</td>
                <td>
                    <select onchange="changeUserRole(${idx}, this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>مستخدم</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدير</option>
                    </select>
                </td>
                <td>${statusHtml}</td>
                <td>${user.lastLogin || '—'}</td>
                <td><button class="delete-btn" onclick="deleteUser(${idx})">حذف</button></td>
            </tr>
        `;
    });
    
    usersTable += `
                        </tbody>
                    </table>
                </div>
                <div class="admin-form">
                    <input type="text" id="newUsername" placeholder="اسم المستخدم">
                    <input type="email" id="newEmail" placeholder="البريد الإلكتروني">
                    <input type="password" id="newPassword" placeholder="كلمة المرور">
                    <button onclick="addUser()">+ إضافة مستخدم</button>
                </div>
            </div>
        </details>
    `;

    // سجل الجلسات المنسدل
    let sessionsTable = `
        <details class="admin-dropdown">
            <summary>📊 سجل الجلسات ▼</summary>
            <div class="dropdown-content-admin">
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead><th>المستخدم</th><th>الإجراء</th><th>الوقت</th></tr></thead>
                        <tbody>
    `;
    const recentSessions = sessions.slice(0, 20);
    recentSessions.forEach(s => {
        sessionsTable += `<tr><td>${s.username}</td><td>${s.action}</td><td>${s.time}</td></tr>`;
    });
    if (recentSessions.length === 0) {
        sessionsTable += `<tr><td colspan="3">لا توجد جلسات مسجلة</td></tr>`;
    }
    sessionsTable += `
                        </tbody>
                    </table>
                </div>
            </div>
        </details>
    `;

    // دليل العملاء المنسدل
    let clientsTable = `
        <details class="admin-dropdown">
            <summary>📋 دليل العملاء ▼</summary>
            <div class="dropdown-content-admin">
                <div class="admin-form">
                    <input type="text" id="clientName" placeholder="اسم العميل">
                    <input type="text" id="clientCompany" placeholder="الشركة">
                    <button onclick="addClient()">+ إضافة عميل</button>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead><th>الاسم</th><th>الشركة</th><th>تاريخ الإضافة</th><th>حذف</th></tr></thead>
                        <tbody>
    `;
    clients.forEach((c, idx) => {
        clientsTable += `
            <tr>
                <td>${c.name}</td>
                <td>${c.company}</td>
                <td>${c.date || '—'}</td>
                <td><button class="delete-btn" onclick="deleteClient(${idx})">حذف</button></td>
            </tr>
        `;
    });
    clientsTable += `
                        </tbody>
                    </table>
                </div>
            </div>
        </details>
    `;

  return `
        ${renderTopBar()}
        <div class="admin-container">
            <h1>👑 لوحة المدير الشاملة</h1>
            <p>مرحباً، ${loggedUser?.username} (مدير النظام)</p>
            ${stats}
            ${usersTable}
            ${sessionsTable}
            ${clientsTable}
        </div>
        </div>
    `; 
}
// تغيير صلاحية المستخدم
window.changeUserRole = function(index, newRole) {
    let users = JSON.parse(localStorage.getItem("users"));
    const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (users[index].username === currentUser.username && newRole !== "admin") {
        alert("❌ لا يمكنك تغيير صلاحيتك إلى مستخدم عادي");
        return;
    }
    users[index].role = newRole;
    localStorage.setItem("users", JSON.stringify(users));
    renderCurrentPage(); // تحديث الصفحة
};

// إدارة العملاء
window.addClient = function() {
    const name = document.getElementById('clientName')?.value.trim();
    const company = document.getElementById('clientCompany')?.value.trim();
    if (!name || !company) { alert('❌ أدخل اسم العميل والشركة'); return; }
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    clients.push({ name, company, date: new Date().toLocaleString("ar-EG") });
    localStorage.setItem('clients', JSON.stringify(clients));
    alert('✅ تم إضافة العميل');
    renderCurrentPage();
};

window.deleteClient = function(idx) {
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    clients.splice(idx, 1);
    localStorage.setItem('clients', JSON.stringify(clients));
    renderCurrentPage();
};
// تسجيل الجلسات
function addSessionLog(username, action) {
    let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
    sessions.unshift({ username, action, time: new Date().toLocaleString("ar-EG") });
    sessions = sessions.slice(0, 100);
    localStorage.setItem("sessions", JSON.stringify(sessions));
}
// تهيئة العملاء إذا لم تكن موجودة
if (!localStorage.getItem("clients")) {
    localStorage.setItem("clients", JSON.stringify([]));
} 
// تحديث آخر نشاط للمستخدم الحالي
function updateLastActive() {
    if (loggedUser) {
        let users = JSON.parse(localStorage.getItem("users"));
        const updatedUsers = users.map(u => {
            if (u.username === loggedUser.username) {
                return { ...u, lastActive: new Date().toISOString() };
            }
            return u;
        });
        localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
}

// تسجيل جلسة دخول
function addSessionLog(username, action) {
    let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
    sessions.unshift({ username, action, time: new Date().toLocaleString("ar-EG") });
    sessions = sessions.slice(0, 100);
    localStorage.setItem("sessions", JSON.stringify(sessions));
}
// 4. صفحة معلومات الجهاز
// ========================
async function renderDeviceInfoPage() {
    let batteryHtml = '<div class="device-card"><h3>🔋 البطارية</h3><div>جاري التحميل...</div></div>';
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            const level = Math.floor(battery.level * 100);
            const charging = battery.charging;
            batteryHtml = `<div class="device-card"><h3>🔋 البطارية</h3><div>🔋 النسبة: <strong>${level}%</strong><br>⚡ الشاحن: <strong>${charging ? 'موصول 🔌' : 'غير موصول 🔋'}</strong></div></div>`;
        } catch(e) { batteryHtml = '<div class="device-card"><h3>🔋 البطارية</h3><div>تعذر التحميل</div></div>'; }
    } else {
        batteryHtml = '<div class="device-card"><h3>🔋 البطارية</h3><div>المتصفح لا يدعم البطارية</div></div>';
    }

    const cpuCores = navigator.hardwareConcurrency || 'غير معروف';
    const ramGB = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'غير معروف';
    let browserName = 'غير معروف', osName = 'غير معروف';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) browserName = 'Google Chrome';
    else if (ua.includes('Firefox')) browserName = 'Mozilla Firefox';
    else if (ua.includes('Safari')) browserName = 'Safari';
    else if (ua.includes('Edge')) browserName = 'Microsoft Edge';
    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Mac')) osName = 'MacOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iPhone')) osName = 'iOS';

    return `
        ${renderTopBar()}
        <h1>📟 معلومات الجهاز</h1>
        <p>بيانات حقيقية من جهازك</p>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 30px;">
            ${batteryHtml}
            <div class="device-card"><h3>🧠 المعالج</h3><div>⚙️ عدد الأنوية: <strong>${cpuCores}</strong></div></div>
            <div class="device-card"><h3>📀 الذاكرة</h3><div>💾 إجمالي RAM: <strong>${ramGB}</strong></div></div>
            <div class="device-card"><h3>💻 المتصفح</h3><div>🌐 <strong>${browserName}</strong><br>🖥️ <strong>${osName}</strong></div></div>
            <div class="device-card"><h3>🖥️ الشاشة</h3><div>📏 الدقة: <strong>${screen.width} × ${screen.height}</strong></div></div>
        </div>
        <div class="note">⚡ ملاحظة: بعض المعلومات العميقة (موديل الجهاز، الحرارة) لا يمكن للمتصفح الوصول إليها لأسباب أمنية.</div>
    `;
}
// ========================
// 4. دوال التحكم
// ========================
window.navigateTo = function(page) {
    currentPage = page;
    renderCurrentPage();
};

async function renderCurrentPage() {
    const app = document.getElementById('app');
    if (!app) return;
    let content = '';

    if (!loggedUser && currentPage !== 'register' && currentPage !== 'forgot') {
        currentPage = 'login';
        content = renderLoginPage();
    } else {
        switch(currentPage) {
            case 'login': content = renderLoginPage(); break;
            case 'register': content = renderRegisterPage(); break;
            case 'forgot': content = renderForgotPage(); break;
            case 'index':
                content = renderSidebar() + '<div class="main-content">' + renderIndexPage() + '</div>';
                break;
            case 'dashboard':
                content = renderSidebar() + '<div class="main-content">' + renderDashboardPage() + '</div>';
                break;
            case 'stats':
                content = renderSidebar() + '<div class="main-content">' + renderStatsPage() + '</div>';
                break;
            case 'admin':
                content = renderSidebar() + '<div class="main-content">' + renderAdminPage() + '</div>';
                break;
            case 'device-info':
                content = renderSidebar() + '<div class="main-content">' + await renderDeviceInfoPage() + '</div>';
                break;
            default: content = renderLoginPage();
        }
    }
    app.innerHTML = content;
    attachGlobalEvents();

    if (loggedUser && loggedUser.loginTime && currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'forgot') {
        const infoDiv = document.getElementById('lastLoginInfo');
        if (infoDiv) infoDiv.innerHTML = `🕓 آخر تسجيل دخول: ${loggedUser.loginTime}`;
    }
}
function attachGlobalEvents() {
    const dropdownBtn = document.querySelector('.user-menu > div');
    if (dropdownBtn) {
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
    }
    document.onclick = () => {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.style.display = 'none';
    };
}
// 6. دوال تسجيل الدخول والإدارة
window.toggleUserMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
};
// تسجيل جلسة جديدة (يتم استدعاؤها عند تسجيل الدخول والخروج)
function addSessionLog(username, action) {
    let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
    sessions.unshift({ username, action, time: new Date().toLocaleString("ar-EG") });
    sessions = sessions.slice(0, 100); // آخر 100 جلسة
    localStorage.setItem("sessions", JSON.stringify(sessions));
}

// تعديل دالة handleLogin لتسجيل دخول

// أضف هذا السطر بعد نجاح تسجيل الدخول:
// addSessionLog(username, "تسجيل دخول");


// أضف هذا السطر قبل حذف الجلسة:
// addSessionLog(loggedUser?.username, "تسجيل خروج");
// ========================
// 5. دوال تسجيل الدخول والإدارة
// ========================
window.handleLogin = function() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    const errorDiv = document.getElementById('loginError');
    if (user) {
        const now = new Date().toLocaleString("ar-EG", { hour12: false });
        const nowISO = new Date().toISOString();
        
        // تحديث المستخدم
        const updatedUsers = users.map(u => {
            if (u.username === username) {
                return { ...u, lastLogin: now, lastActive: nowISO };
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        loggedUser = { username: user.username, role: user.role, loginTime: now };
        localStorage.setItem('loggedInUser', JSON.stringify(loggedUser));
        
        // تسجيل جلسة الدخول
        addSessionLog(username, "تسجيل دخول");
        
        if (errorDiv) errorDiv.innerHTML = '<span style="color:#2ecc71">✅ تم الدخول بنجاح</span>';
        setTimeout(() => navigateTo('dashboard'), 1000);
    } else {
        if (errorDiv) errorDiv.innerHTML = '❌ خطأ في الاسم أو كلمة المرور';
    }
};

window.handleRegister = function() {
    const username = document.getElementById('regUsername')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const pass = document.getElementById('regPassword')?.value.trim();
    const confirm = document.getElementById('regConfirm')?.value.trim();
    if (!username || !email || !pass) { alert('❌ جميع الحقول مطلوبة'); return; }
    if (pass !== confirm) { alert('❌ كلمة المرور غير متطابقة'); return; }
    let users = JSON.parse(localStorage.getItem('users'));
    if (users.find(u => u.username === username)) { alert('❌ المستخدم موجود'); return; }
    users.push({ username, email, password: pass, role: 'user', lastLogin: null });
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم التسجيل بنجاح');
    navigateTo('login');
};

window.handleForgot = function() {
    const username = document.getElementById('forgotUsername')?.value.trim();
    const email = document.getElementById('forgotEmail')?.value.trim();
    const newPass = document.getElementById('newPassword')?.value.trim();
    let users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(u => u.username === username && u.email === email);
    if (idx === -1 || !newPass) { alert('❌ بيانات غير صحيحة'); return; }
    users[idx].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم تغيير كلمة المرور');
    navigateTo('login');
};

window.addUser = function() {
    const username = document.getElementById('newUsername')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    if (!username || !email || !password) { alert('❌ جميع الحقول مطلوبة'); return; }
    let users = JSON.parse(localStorage.getItem('users'));
    if (users.find(u => u.username === username)) { alert('❌ المستخدم موجود'); return; }
    users.push({ username, email, password, role: 'user', lastLogin: null, lastActive: null });
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم إضافة المستخدم');
    renderCurrentPage();
};

window.deleteUser = function(idx) {
    let users = JSON.parse(localStorage.getItem('users'));
    if (users[idx].username === loggedUser?.username) { alert('❌ لا يمكن حذف حسابك'); return; }
    users.splice(idx, 1);
    localStorage.setItem('users', JSON.stringify(users));
    renderCurrentPage();
};

window.showUserData = function() {
    alert(`📋 بيانات المستخدم\nالاسم: ${loggedUser?.username}\nالصلاحية: ${loggedUser?.role === 'admin' ? 'مدير' : 'مستخدم'}`);
};
// تعديل دالlogout ة لتسجيل خروج
window.logout = function() {
    if (loggedUser) {
        addSessionLog(loggedUser.username, "تسجيل خروج");
        
        // تحديث lastActive
        let users = JSON.parse(localStorage.getItem("users"));
        const updatedUsers = users.map(u => {
            if (u.username === loggedUser.username) {
                return { ...u, lastActive: null };
            }
            return u;
        });
        localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
    loggedUser = null;
    localStorage.removeItem('loggedInUser');
    navigateTo('login');
};
// ========================
// 6. بدء التشغيل
// ========================
(async function init() {
    loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    await updateRealBattery();
    updateSystemLoad();
    setInterval(async () => { await updateRealBattery(); }, 30000);
    navigateTo(loggedUser ? 'dashboard' : 'login');
    
    // رسم الرسوم البيانية
function initCharts() {
    const cpuCtx = document.getElementById('cpuChart');
    const ramCtx = document.getElementById('ramChart');
    
    if (cpuCtx && ramCtx) {
        // رسوم بيانية مبسطة
        const cpuChart = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: ['نشاط 1', 'نشاط 2', 'نشاط 3', 'نشاط 4', 'نشاط 5'],
                datasets: [{ label: 'CPU %', data: [23, 45, 38, 52, systemStats.cpu], borderColor: '#3b6eff', fill: false }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
        
        const ramChart = new Chart(ramCtx, {
            type: 'line',
            data: {
                labels: ['نشاط 1', 'نشاط 2', 'نشاط 3', 'نشاط 4', 'نشاط 5'],
                datasets: [{ label: 'RAM %', data: [30, 42, 38, 45, (systemStats.ramUsed / systemStats.ramTotal) * 100], borderColor: '#9b59b6', fill: false }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
        
        // تحديث الرسوم البيانية كل 5 ثواني
        setInterval(() => {
            cpuChart.data.datasets[0].data.push(systemStats.cpu);
            cpuChart.data.datasets[0].data.shift();
            cpuChart.update();
            
            const ramNew = (systemStats.ramUsed / systemStats.ramTotal) * 100;
            ramChart.data.datasets[0].data.push(ramNew);
            ramChart.data.datasets[0].data.shift();
            ramChart.update();
            
            // تحديث إحصائيات البطارية
            const statsBatteryFill = document.getElementById('statsBatteryFill');
            const statsBatteryPercent = document.getElementById('statsBatteryPercent');
            const statsBatteryStatus = document.getElementById('statsBatteryStatus');
            if (statsBatteryFill && statsBatteryPercent && statsBatteryStatus) {
                statsBatteryFill.style.width = `${systemStats.battery}%`;
                statsBatteryPercent.innerHTML = `${systemStats.battery}%`;
                statsBatteryStatus.innerHTML = systemStats.charging ? "🔌 موصول بالشاحن" : "🔋 يعمل على البطارية";
            }
        }, 5000);
    }
}

// تعديل دالة renderCurrentPage لتضمين الرسوم البيانية
const originalRender = renderCurrentPage;
renderCurrentPage = function() {
    originalRender();
    if (currentPage === 'stats') {
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                initCharts();
            } else {
                console.log("انتظار تحميل Chart.js...");
                setTimeout(initCharts, 500);
            }
        }, 100);
    }
};
// صفحة معلومات الجهاز
// ========================

}) ();