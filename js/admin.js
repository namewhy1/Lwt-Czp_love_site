// ============ 导航切换 ============
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');
const panelTitle = document.getElementById('panelTitle');

const panelTitles = {
    'basic': '⚙️ 基础设置',
    'password': '🔐 密码设置',
    'theme': '🎨 主题样式',
    'photos': '🖼️ 相册管理',
    'music': '🎵 音乐设置',
    'timeline': '📖 故事时间轴',
    'message': '💌 心语留言',
    'broadcast': '📣 小小广播站',
    'wishlist': '⭐ 心愿清单',
    'easterEgg': '✨ 彩蛋设置',
    'effects': '✨ 特效设置',
    'sweetwords': '💬 甜蜜话语',
    'footer': '📝 页脚设置',
    'backup': '💾 数据备份'
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const panel = item.dataset.panel;
        if (!panel) return;

        navItems.forEach(i => i.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        document.getElementById(`panel-${panel}`).classList.add('active');
        panelTitle.textContent = panelTitles[panel];
    });
});

// ============ 显示提示 ============
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = (type === 'success' ? '✓ ' : '⚠ ') + message;
    toast.style.background = type === 'success' ? '#7fb77e' : '#e57373';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ 云端同步（Vercel KV）===========
function getAdminToken() {
    return localStorage.getItem('admin_token') || '';
}

function updateAdminTokenStatus() {
    const statusEl = document.getElementById('adminTokenStatus');
    const inputEl = document.getElementById('adminTokenInput');
    const token = getAdminToken();
    if (statusEl) {
        statusEl.textContent = token ? '状态：已设置（可同步云端）' : '状态：未设置（只能本地保存）';
        statusEl.style.color = token ? '#7fb77e' : '#e57373';
    }
    if (inputEl) {
        inputEl.value = token ? '••••••••' : '';
    }
}

function saveAdminToken() {
    const inputEl = document.getElementById('adminTokenInput');
    if (!inputEl) return;

    const v = inputEl.value.trim();
    if (!v || v === '••••••••') {
        showToast('请输入正确的管理员口令', 'error');
        return;
    }
    localStorage.setItem('admin_token', v);
    showToast('口令已保存，本设备可直接同步云端');
    updateAdminTokenStatus();
}

function clearAdminToken() {
    localStorage.removeItem('admin_token');
    showToast('已清除口令，本设备将无法同步云端');
    updateAdminTokenStatus();
}

function buildCloudConfig() {
    return {
        basic: JSON.parse(localStorage.getItem('lovesite_basic') || 'null'),
        password: JSON.parse(localStorage.getItem('lovesite_password') || 'null'),
        theme: JSON.parse(localStorage.getItem('lovesite_theme') || 'null'),
        photos: JSON.parse(localStorage.getItem('lovesite_photos') || 'null'),
        music: JSON.parse(localStorage.getItem('lovesite_music') || 'null'),
        timeline: JSON.parse(localStorage.getItem('lovesite_timeline') || 'null'),
        message: JSON.parse(localStorage.getItem('lovesite_message') || 'null'),
        broadcast: JSON.parse(localStorage.getItem('lovesite_broadcast') || 'null'),
        easterEgg: JSON.parse(localStorage.getItem('lovesite_easter_egg') || 'null'),
        wishlist: JSON.parse(localStorage.getItem('lovesite_wishlist') || 'null'),
        effects: JSON.parse(localStorage.getItem('lovesite_effects') || 'null'),
        sweetwords: JSON.parse(localStorage.getItem('lovesite_sweetwords') || 'null'),
        footer: JSON.parse(localStorage.getItem('lovesite_footer') || 'null'),
    };
}

async function syncToCloud() {
    const token = getAdminToken();
    if (!token) {
        showToast('未检测到 admin_token：已本地保存，但未同步到云端（跨设备不会生效）', 'error');
        return;
    }

    const config = buildCloudConfig();
    try {
        const res = await fetch('/api/config/set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': token
            },
            body: JSON.stringify({ config })
        });

        if (!res.ok) {
            const t = await res.text();
            throw new Error(t);
        }

        showToast('已同步到云端（跨设备可用）');
    } catch (e) {
        showToast('云端同步失败：' + (e?.message || e), 'error');
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// ============ 基础设置 ============
let typewriterTexts = [
    '时光温柔，记录下我们相遇的每一个瞬间',
    '你是我最美丽的意外',
    '遇见你是我最大的幸运',
    '愿与你共度余生的每一天'
];

function renderTypewriterTexts() {
    const container = document.getElementById('typewriterTexts');
    container.innerHTML = typewriterTexts.map((text, index) => `
        <div class="text-list-item">
            <input type="text" value="${text}" onchange="typewriterTexts[${index}] = this.value">
            <button class="remove-text-btn" onclick="removeTypewriterText(${index})">✕</button>
        </div>
    `).join('');
}

function addTypewriterText() {
    typewriterTexts.push('新的浪漫句子...');
    renderTypewriterTexts();
}

function removeTypewriterText(index) {
    if (typewriterTexts.length > 1) {
        typewriterTexts.splice(index, 1);
        renderTypewriterTexts();
    }
}

function saveBasicSettings() {
    const settings = {
        loveDate: document.getElementById('loveDate').value,
        typewriterTexts: typewriterTexts,
        siteTitle: document.getElementById('siteTitle').value,
        siteSubtitle: document.getElementById('siteSubtitle').value
    };
    localStorage.setItem('lovesite_basic', JSON.stringify(settings));
    showToast('基础设置保存成功！');
    syncToCloud();
}

function loadBasicSettings() {
    const saved = localStorage.getItem('lovesite_basic');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('loveDate').value = settings.loveDate || '2025-12-24';
        document.getElementById('siteTitle').value = settings.siteTitle || '遇见你，真好';
        document.getElementById('siteSubtitle').value = settings.siteSubtitle || '献给最特别的你';
        if (settings.typewriterTexts) {
            typewriterTexts = settings.typewriterTexts;
        }
    } else {
        document.getElementById('loveDate').value = '2025-12-24';
    }
    renderTypewriterTexts();
}

function resetBasicSettings() {
    localStorage.removeItem('lovesite_basic');
    typewriterTexts = [
        '时光温柔，记录下我们相遇的每一个瞬间',
        '你是我最美丽的意外',
        '遇见你是我最大的幸运',
        '愿与你共度余生的每一天'
    ];
    loadBasicSettings();
    showToast('已重置为默认设置');
}

// ============ 相册管理 ============
let photos = [
    { url: 'https://picsum.photos/1200/800?random=1', caption: '每一张照片，都是一段美好的回忆' },
    { url: 'https://picsum.photos/1200/800?random=2', caption: '你的笑容是我最爱的风景' },
    { url: 'https://picsum.photos/1200/800?random=3', caption: '和你在一起的每一刻都很珍贵' },
    { url: 'https://picsum.photos/1200/800?random=4', caption: '这是我们的故事' }
];

function renderPhotos() {
    const container = document.getElementById('photoList');
    container.innerHTML = photos.map((photo, index) => `
        <div class="image-item">
            <img src="${photo.url}" alt="照片${index + 1}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22><rect fill=%22%23f5d0d8%22 width=%22200%22 height=%22150%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23e8a4b8%22>图片加载失败</text></svg>'">
            <button class="remove-btn" onclick="removePhoto(${index})">✕</button>
            <div class="caption-input">
                <input type="text" value="${photo.caption}" placeholder="图片说明" onchange="photos[${index}].caption = this.value">
            </div>
        </div>
    `).join('');
}

function addPhotoUrl() {
    const url = prompt('请输入图片URL：');
    if (url) {
        photos.push({ url, caption: '新的美好回忆' });
        renderPhotos();
    }
}

async function uploadLocalPhotos(input) {
    const files = input.files;
    if (!files || files.length === 0) return;

    const token = getAdminToken();
    if (!token) {
        showToast('请先在顶部设置"管理员口令"，否则无法上传到云端', 'error');
        input.value = '';
        return;
    }

    for (let file of files) {
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const res = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    dataUrl
                })
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t);
            }

            const out = await res.json();
            photos.push({
                url: out.url,
                caption: file.name.replace(/\.[^/.]+$/, '')
            });

            renderPhotos();
        } catch (e) {
            showToast('上传失败：' + (e?.message || e), 'error');
        }
    }

    input.value = '';
    showToast('图片已上传到云端，请点击"保存相册"同步配置');
}

function removePhoto(index) {
    if (confirm('确定删除这张照片吗？')) {
        photos.splice(index, 1);
        renderPhotos();
    }
}

function savePhotoSettings() {
    localStorage.setItem('lovesite_photos', JSON.stringify(photos));
    showToast('相册保存成功！');
    syncToCloud();
}

function loadPhotoSettings() {
    const saved = localStorage.getItem('lovesite_photos');
    if (saved) {
        photos = JSON.parse(saved);
    }
    renderPhotos();
}

// ============ 音乐设置 ============
let musicData = {
    title: '晴天',
    artist: '周杰伦',
    url: ''
};

function saveMusicSettings() {
    musicData.title = document.getElementById('musicTitle').value;
    musicData.artist = document.getElementById('musicArtist').value;
    musicData.url = document.getElementById('musicUrl').value;
    localStorage.setItem('lovesite_music', JSON.stringify(musicData));
    showToast('音乐设置保存成功！');
    syncToCloud();
}

function loadMusicSettings() {
    const saved = localStorage.getItem('lovesite_music');
    if (saved) {
        musicData = JSON.parse(saved);
    }
    document.getElementById('musicTitle').value = musicData.title || '晴天';
    document.getElementById('musicArtist').value = musicData.artist || '周杰伦';
    document.getElementById('musicUrl').value = musicData.url || '';

    if (musicData.url) {
        showCurrentMusic();
    }
}

function uploadLocalMusic(input) {
    const file = input.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        document.getElementById('musicUrl').value = url;
        musicData.url = url;
        musicData.fileName = file.name;
        musicData.fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

        const reader = new FileReader();
        reader.onload = function(e) {
            musicData.url = e.target.result;
            document.getElementById('musicUrl').value = '已上传: ' + file.name;
            showCurrentMusic();
        };
        reader.readAsDataURL(file);
    }
}

function showCurrentMusic() {
    const container = document.getElementById('currentMusic');
    container.style.display = 'flex';
    document.getElementById('currentMusicName').textContent = musicData.fileName || '已设置音乐';
    document.getElementById('currentMusicSize').textContent = musicData.fileSize || '';
}

function removeMusic() {
    musicData.url = '';
    musicData.fileName = '';
    musicData.fileSize = '';
    document.getElementById('musicUrl').value = '';
    document.getElementById('currentMusic').style.display = 'none';
}

// ============ 时间轴设置 ============
let timelineItems = [
    { date: '2024年 · 春', title: '初次相遇', content: '缘分让我们在茫茫人海中相遇，那一刻仿佛时间都静止了，我知道你就是我一直在寻找的人。' },
    { date: '2024年 · 夏', title: '渐渐熟悉', content: '从陌生到熟悉，每一次对话都让我更了解你，发现你身上更多美好的特质。' },
    { date: '此刻 · 现在', title: '未来可期', content: '感谢命运的安排，让我遇见了你。期待与你一起，书写更多美好的篇章。' }
];

function renderTimelineItems() {
    const container = document.getElementById('timelineItems');
    container.innerHTML = timelineItems.map((item, index) => `
        <div class="timeline-item-edit">
            <div class="item-header">
                <span class="item-number">故事 ${index + 1}</span>
                <button class="btn btn-danger" onclick="removeTimelineItem(${index})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">删除</button>
            </div>
            <div class="form-group">
                <label>日期</label>
                <input type="text" value="${item.date}" onchange="timelineItems[${index}].date = this.value" placeholder="2024年 · 春">
            </div>
            <div class="form-group">
                <label>标题</label>
                <input type="text" value="${item.title}" onchange="timelineItems[${index}].title = this.value" placeholder="初次相遇">
            </div>
            <div class="form-group">
                <label>内容</label>
                <textarea onchange="timelineItems[${index}].content = this.value" placeholder="描述这段故事...">${item.content}</textarea>
            </div>
        </div>
    `).join('');
}

function addTimelineItem() {
    timelineItems.push({
        date: '新的时间',
        title: '新的故事',
        content: '在这里写下你们的故事...'
    });
    renderTimelineItems();
}

function removeTimelineItem(index) {
    if (timelineItems.length > 1 && confirm('确定删除这段故事吗？')) {
        timelineItems.splice(index, 1);
        renderTimelineItems();
    }
}

function saveTimelineSettings() {
    localStorage.setItem('lovesite_timeline', JSON.stringify(timelineItems));
    showToast('故事时间轴保存成功！');
    syncToCloud();
}

function loadTimelineSettings() {
    const saved = localStorage.getItem('lovesite_timeline');
    if (saved) {
        timelineItems = JSON.parse(saved);
    }
    renderTimelineItems();
}

// ============ 心语设置 ============
function saveMessageSettings() {
    const settings = {
        content: document.getElementById('messageContent').value,
        signature: document.getElementById('messageSignature').value
    };
    localStorage.setItem('lovesite_message', JSON.stringify(settings));
    showToast('心语保存成功！');
    syncToCloud();
}

function loadMessageSettings() {
    const saved = localStorage.getItem('lovesite_message');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('messageContent').value = settings.content || '';
        document.getElementById('messageSignature').value = settings.signature || '';
    } else {
        document.getElementById('messageContent').value = '感谢你出现在我的生命里\n让平凡的日子闪闪发光\n愿未来的每一天\n都有你的陪伴';
        document.getElementById('messageSignature').value = '写给最特别的你';
    }
}

// ============ 密码设置 ============
function savePasswordSettings() {
    const settings = {
        password: document.getElementById('sitePassword').value,
        hint: document.getElementById('passwordHint').value,
        title: document.getElementById('passwordTitle').value,
        subtitle: document.getElementById('passwordSubtitle').value,
        btnText: document.getElementById('passwordBtnText').value,
        errorText: document.getElementById('passwordErrorText').value
    };
    localStorage.setItem('lovesite_password', JSON.stringify(settings));
    showToast('密码设置保存成功！');
    syncToCloud();
}

function loadPasswordSettings() {
    const saved = localStorage.getItem('lovesite_password');
    if (saved) {
        const s = JSON.parse(saved);
        document.getElementById('sitePassword').value = s.password || '20251224';
        document.getElementById('passwordHint').value = s.hint || '💡 提示：一个特别的日子';
        document.getElementById('passwordTitle').value = s.title || '这是我们的秘密小站';
        document.getElementById('passwordSubtitle').value = s.subtitle || '请输入密码进入';
        document.getElementById('passwordBtnText').value = s.btnText || '进入我们的世界 💕';
        document.getElementById('passwordErrorText').value = s.errorText || '密码不正确，再想想哦～';
    } else {
        document.getElementById('sitePassword').value = '20251224';
        document.getElementById('passwordHint').value = '💡 提示：一个特别的日子';
        document.getElementById('passwordTitle').value = '这是我们的秘密小站';
        document.getElementById('passwordSubtitle').value = '请输入密码进入';
        document.getElementById('passwordBtnText').value = '进入我们的世界 💕';
        document.getElementById('passwordErrorText').value = '密码不正确，再想想哦～';
    }
}

// ============ 主题设置 ============
let currentTheme = 'pink';
const themePresets = {
    pink: { primary: '#e8a4b8', secondary: '#f5d0d8', bg: '#faf6f2', text: '#4a3f44' },
    purple: { primary: '#b8a4e8', secondary: '#d0d0f5', bg: '#f8f6fa', text: '#44404a' },
    blue: { primary: '#a4c8e8', secondary: '#d0e8f5', bg: '#f6f9fa', text: '#404a4a' },
    gold: { primary: '#e8c8a4', secondary: '#f5e8d0', bg: '#faf8f6', text: '#4a4840' },
    mint: { primary: '#a4e8c8', secondary: '#d0f5e8', bg: '#f6faf8', text: '#404a44' },
    coral: { primary: '#e8a4a4', secondary: '#f5d0d0', bg: '#faf6f6', text: '#4a4040' }
};

function applyTheme(theme) {
    currentTheme = theme;
    document.querySelectorAll('.theme-preset').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const colors = themePresets[theme];
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('bgColor').value = colors.bg;
    document.getElementById('textColor').value = colors.text;
}

function saveThemeSettings() {
    const settings = {
        theme: currentTheme,
        primary: document.getElementById('primaryColor').value,
        secondary: document.getElementById('secondaryColor').value,
        bg: document.getElementById('bgColor').value,
        text: document.getElementById('textColor').value,
        titleFont: document.getElementById('titleFont').value
    };
    localStorage.setItem('lovesite_theme', JSON.stringify(settings));
    showToast('主题设置保存成功！');
    syncToCloud();
}

function loadThemeSettings() {
    const saved = localStorage.getItem('lovesite_theme');
    if (saved) {
        const s = JSON.parse(saved);
        currentTheme = s.theme || 'pink';
        document.getElementById('primaryColor').value = s.primary || '#e8a4b8';
        document.getElementById('secondaryColor').value = s.secondary || '#f5d0d8';
        document.getElementById('bgColor').value = s.bg || '#faf6f2';
        document.getElementById('textColor').value = s.text || '#4a3f44';
        document.getElementById('titleFont').value = s.titleFont || 'Ma Shan Zheng';
    }
}

function resetTheme() {
    applyTheme('pink');
    document.getElementById('titleFont').value = 'Ma Shan Zheng';
    showToast('已恢复默认主题');
}

// ============ 小小广播站 ============
let broadcastEnabled = true;
let broadcastItems = [
    {
        enabled: true,
        priority: 10,
        tag: '期末加油',
        title: '期末周加油',
        content: '不管考得怎样，你已经很努力了。\n我一直站在你这边。\n记得按时吃饭、早点睡。',
        startDate: '',
        endDate: '',
        countdownDate: ''
    },
    {
        enabled: true,
        priority: 8,
        tag: '快见面啦',
        title: '快见面啦',
        content: '今天又离见你近了一点点。\n想到你我就会开心。',
        startDate: '',
        endDate: '',
        countdownDate: ''
    },
    {
        enabled: true,
        priority: 6,
        tag: '想你',
        title: '想你',
        content: '很想你。\n也很期待我们下次见面。\n抱抱。',
        startDate: '',
        endDate: '',
        countdownDate: ''
    }
];

function toggleBroadcastEnabled() {
    broadcastEnabled = !broadcastEnabled;
    document.getElementById('broadcastToggle')?.classList.toggle('active', broadcastEnabled);
}

function renderBroadcastItems() {
    const container = document.getElementById('broadcastItems');
    if (!container) return;

    container.innerHTML = broadcastItems.map((item, index) => `
        <div class="timeline-item-edit" style="border-left-color: #64b5f6;">
            <div class="item-header">
                <span class="item-number">广播 ${index + 1}</span>
                <button class="btn btn-danger" onclick="removeBroadcastItem(${index})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">删除</button>
            </div>

            <div class="form-group">
                <div class="toggle-wrapper">
                    <span>启用这条</span>
                    <div class="toggle ${item.enabled ? 'active' : ''}" onclick="toggleBroadcastItem(${index})"></div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" value="${escapeHtml(item.title || '')}" onchange="broadcastItems[${index}].title = this.value">
                </div>
                <div class="form-group">
                    <label>标签（可选）</label>
                    <input type="text" value="${escapeHtml(item.tag || '')}" onchange="broadcastItems[${index}].tag = this.value" placeholder="例如：期末加油">
                </div>
                <div class="form-group">
                    <label>优先级（数字越大越优先）</label>
                    <input type="number" value="${Number.isFinite(item.priority) ? item.priority : 0}" onchange="broadcastItems[${index}].priority = Number(this.value)" min="0" step="1">
                </div>
            </div>

            <div class="form-group">
                <label>正文（可多行）</label>
                <textarea rows="4" onchange="broadcastItems[${index}].content = this.value">${item.content || ''}</textarea>
                <p class="form-hint">首页会按原样换行显示</p>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>开始日期（可不填）</label>
                    <input type="date" value="${escapeHtml(item.startDate || '')}" onchange="broadcastItems[${index}].startDate = this.value">
                    <p class="form-hint">不填表示从现在起都可以</p>
                </div>
                <div class="form-group">
                    <label>结束日期（可不填）</label>
                    <input type="date" value="${escapeHtml(item.endDate || '')}" onchange="broadcastItems[${index}].endDate = this.value">
                    <p class="form-hint">不填表示一直有效</p>
                </div>
                <div class="form-group">
                    <label>倒计时目标日期（可选）</label>
                    <input type="date" value="${escapeHtml(item.countdownDate || '')}" onchange="broadcastItems[${index}].countdownDate = this.value">
                    <p class="form-hint">例如"见面日期"，首页显示还有多少天</p>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleBroadcastItem(index) {
    broadcastItems[index].enabled = !broadcastItems[index].enabled;
    renderBroadcastItems();
}

function addBroadcastItem() {
    broadcastItems.push({
        enabled: true,
        priority: 5,
        tag: '',
        title: '新的广播',
        content: '写下想对她说的话…',
        startDate: '',
        endDate: '',
        countdownDate: ''
    });
    renderBroadcastItems();
}

function removeBroadcastItem(index) {
    if (confirm('确定删除这条广播吗？')) {
        broadcastItems.splice(index, 1);
        renderBroadcastItems();
    }
}

function saveBroadcastSettings() {
    const settings = {
        enabled: broadcastEnabled,
        items: broadcastItems
    };
    localStorage.setItem('lovesite_broadcast', JSON.stringify(settings));
    showToast('广播保存成功！');
    syncToCloud();
}

function loadBroadcastSettings() {
    const saved = localStorage.getItem('lovesite_broadcast');
    if (saved) {
        const s = JSON.parse(saved);
        broadcastEnabled = s.enabled !== false;
        broadcastItems = Array.isArray(s.items) ? s.items : broadcastItems;
    }
    document.getElementById('broadcastToggle')?.classList.toggle('active', broadcastEnabled);
    renderBroadcastItems();
}

// ============ 心愿清单 ============
let wishlistEnabled = true;
let wishItems = [
    { text: '一起看一场日出', completed: false },
    { text: '去一个新的城市旅行', completed: false },
    { text: '一起做一顿大餐', completed: false },
    { text: '拍一组情侣写真', completed: false }
];

function toggleWishlist() {
    wishlistEnabled = !wishlistEnabled;
    document.getElementById('wishlistToggle').classList.toggle('active', wishlistEnabled);
}

function renderWishItems() {
    const container = document.getElementById('wishlistItems');
    container.innerHTML = wishItems.map((item, index) => `
        <div class="wish-item">
            <div class="wish-checkbox ${item.completed ? 'checked' : ''}" onclick="toggleWishItem(${index})"></div>
            <input type="text" value="${item.text}" onchange="wishItems[${index}].text = this.value" style="${item.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
            <button class="btn btn-danger" onclick="removeWishItem(${index})" style="padding: 0.3rem 0.6rem;">✕</button>
        </div>
    `).join('');
}

function toggleWishItem(index) {
    wishItems[index].completed = !wishItems[index].completed;
    renderWishItems();
}

function addWishItem() {
    wishItems.push({ text: '新的心愿...', completed: false });
    renderWishItems();
}

function removeWishItem(index) {
    wishItems.splice(index, 1);
    renderWishItems();
}

function saveWishlistSettings() {
    const settings = {
        enabled: wishlistEnabled,
        items: wishItems
    };
    localStorage.setItem('lovesite_wishlist', JSON.stringify(settings));
    showToast('心愿清单保存成功！');
    syncToCloud();
}

function loadWishlistSettings() {
    const saved = localStorage.getItem('lovesite_wishlist');
    if (saved) {
        const s = JSON.parse(saved);
        wishlistEnabled = s.enabled !== false;
        wishItems = s.items || wishItems;
        document.getElementById('wishlistToggle').classList.toggle('active', wishlistEnabled);
    }
    renderWishItems();
}

// ============ 彩蛋设置 ============
let easterEggConfig = {
    enabled: true,
    startDate: '',
    endDate: '',
    badgeText: '📚 期末周加油',
    cheerTitle: '你真的很棒',
    cheerMessages: [
        '不管考得怎样，你已经很努力了。\n我一直在你身边。',
        '慢慢来，一步一步就会到终点。\n抱抱。',
        '累了就休息一下，喝口水也很棒。\n我为你骄傲。'
    ],
    stickers: [
        { id: 'study', text: '我今天复习了' },
        { id: 'eat', text: '我今天好好吃饭了' },
        { id: 'sleep', text: '我今天早点睡' }
    ],
    nightTipEnabled: true,
    nightTipText: '该休息啦，明天也会继续为你加油。'
};

function toggleEggEnabled() {
    easterEggConfig.enabled = !easterEggConfig.enabled;
    document.getElementById('eggToggle')?.classList.toggle('active', easterEggConfig.enabled);
}

function toggleEggNight() {
    easterEggConfig.nightTipEnabled = !easterEggConfig.nightTipEnabled;
    document.getElementById('eggNightToggle')?.classList.toggle('active', easterEggConfig.nightTipEnabled);
}

function renderEggCheerList() {
    const container = document.getElementById('eggCheerList');
    if (!container) return;
    container.innerHTML = easterEggConfig.cheerMessages.map((text, index) => `
        <div class="text-list-item">
            <input type="text" value="${escapeHtml(text)}" onchange="easterEggConfig.cheerMessages[${index}] = this.value">
            <button class="remove-text-btn" onclick="removeEggCheer(${index})">✕</button>
        </div>
    `).join('');
}

function addEggCheer() {
    easterEggConfig.cheerMessages.push('新的一句鼓励...');
    renderEggCheerList();
}

function removeEggCheer(index) {
    if (easterEggConfig.cheerMessages.length > 1) {
        easterEggConfig.cheerMessages.splice(index, 1);
        renderEggCheerList();
    }
}

function renderEggStickerList() {
    const container = document.getElementById('eggStickerList');
    if (!container) return;
    container.innerHTML = easterEggConfig.stickers.map((item, index) => `
        <div class="text-list-item">
            <input type="text" value="${escapeHtml(item.text)}" onchange="easterEggConfig.stickers[${index}].text = this.value" placeholder="贴纸文字">
            <button class="remove-text-btn" onclick="removeEggSticker(${index})">✕</button>
        </div>
    `).join('');
}

function addEggSticker() {
    if (easterEggConfig.stickers.length < 5) {
        easterEggConfig.stickers.push({ id: `custom_${Date.now()}`, text: '新的小成就' });
        renderEggStickerList();
    } else {
        showToast('最多添加5个贴纸哦', 'warning');
    }
}

function removeEggSticker(index) {
    if (easterEggConfig.stickers.length > 1) {
        easterEggConfig.stickers.splice(index, 1);
        renderEggStickerList();
    }
}

function saveEggSettings() {
    easterEggConfig.startDate = document.getElementById('eggStartDate').value;
    easterEggConfig.endDate = document.getElementById('eggEndDate').value;
    easterEggConfig.badgeText = document.getElementById('eggBadgeText').value;
    easterEggConfig.cheerTitle = document.getElementById('eggCheerTitle').value;
    easterEggConfig.nightTipText = document.getElementById('eggNightText').value;

    localStorage.setItem('lovesite_easter_egg', JSON.stringify(easterEggConfig));
    showToast('彩蛋设置保存成功！');
    syncToCloud();
}

function loadEggSettings() {
    const saved = localStorage.getItem('lovesite_easter_egg');
    if (saved) {
        const s = JSON.parse(saved);
        easterEggConfig = { ...easterEggConfig, ...s };
    }

    document.getElementById('eggToggle')?.classList.toggle('active', easterEggConfig.enabled);
    document.getElementById('eggStartDate').value = easterEggConfig.startDate;
    document.getElementById('eggEndDate').value = easterEggConfig.endDate;
    document.getElementById('eggBadgeText').value = easterEggConfig.badgeText;
    document.getElementById('eggCheerTitle').value = easterEggConfig.cheerTitle;
    document.getElementById('eggNightToggle')?.classList.toggle('active', easterEggConfig.nightTipEnabled);
    document.getElementById('eggNightText').value = easterEggConfig.nightTipText;

    renderEggCheerList();
    renderEggStickerList();
}

// ============ 特效设置 ============
let effects = {
    petal: true,
    sparkle: true,
    heart: true,
    firework: true
};

function toggleEffect(type) {
    effects[type] = !effects[type];
    document.getElementById(type + 'Toggle').classList.toggle('active', effects[type]);
}

function saveEffectSettings() {
    const settings = {
        ...effects,
        fireworkDates: document.getElementById('fireworkDates').value
    };
    localStorage.setItem('lovesite_effects', JSON.stringify(settings));
    showToast('特效设置保存成功！');
    syncToCloud();
}

function loadEffectSettings() {
    const saved = localStorage.getItem('lovesite_effects');
    if (saved) {
        const s = JSON.parse(saved);
        effects = { petal: s.petal !== false, sparkle: s.sparkle !== false, heart: s.heart !== false, firework: s.firework !== false };
        document.getElementById('petalToggle').classList.toggle('active', effects.petal);
        document.getElementById('sparkleToggle').classList.toggle('active', effects.sparkle);
        document.getElementById('heartToggle').classList.toggle('active', effects.heart);
        document.getElementById('fireworkToggle').classList.toggle('active', effects.firework);
        document.getElementById('fireworkDates').value = s.fireworkDates || '12-24, 02-14, 05-20';
    } else {
        document.getElementById('fireworkDates').value = '12-24, 02-14, 05-20';
    }
}

// ============ 甜蜜话语 ============
let sweetwordsEnabled = true;
let sweetwords = [
    '今天也要爱你多一点 💕',
    '有你的日子，每天都是情人节',
    '你是我生命中最美的意外',
    '想和你一起慢慢变老',
    '遇见你，是我最幸运的事'
];

function toggleSweetwords() {
    sweetwordsEnabled = !sweetwordsEnabled;
    document.getElementById('sweetwordsToggle').classList.toggle('active', sweetwordsEnabled);
}

function renderSweetwords() {
    const container = document.getElementById('sweetwordsList');
    container.innerHTML = sweetwords.map((text, index) => `
        <div class="sweet-message-item">
            <input type="text" value="${text}" onchange="sweetwords[${index}] = this.value">
            <button class="btn btn-danger" onclick="removeSweetWord(${index})" style="padding: 0.3rem 0.6rem;">✕</button>
        </div>
    `).join('');
}

function addSweetWord() {
    sweetwords.push('新的甜蜜话语...');
    renderSweetwords();
}

function removeSweetWord(index) {
    sweetwords.splice(index, 1);
    renderSweetwords();
}

function saveSweetwordsSettings() {
    const settings = {
        enabled: sweetwordsEnabled,
        frequency: document.getElementById('sweetwordsFreq').value,
        messages: sweetwords
    };
    localStorage.setItem('lovesite_sweetwords', JSON.stringify(settings));
    showToast('甜蜜话语保存成功！');
    syncToCloud();
}

function loadSweetwordsSettings() {
    const saved = localStorage.getItem('lovesite_sweetwords');
    if (saved) {
        const s = JSON.parse(saved);
        sweetwordsEnabled = s.enabled !== false;
        sweetwords = s.messages || sweetwords;
        document.getElementById('sweetwordsToggle').classList.toggle('active', sweetwordsEnabled);
        document.getElementById('sweetwordsFreq').value = s.frequency || 'always';
    }
    renderSweetwords();
}

// ============ 页脚设置 ============
let navMenuItems = [
    { name: '首页', href: '#home', enabled: true },
    { name: '相册', href: '#gallery', enabled: true },
    { name: '音乐', href: '#music', enabled: true },
    { name: '故事', href: '#timeline', enabled: true },
    { name: '心语', href: '#message', enabled: true }
];

function renderNavItems() {
    const container = document.getElementById('navItems');
    container.innerHTML = navMenuItems.map((item, index) => `
        <div class="effect-toggle" style="margin-bottom: 0.5rem;">
            <div class="effect-info">
                <input type="text" value="${item.name}" onchange="navMenuItems[${index}].name = this.value" style="width: 100px; padding: 0.4rem;">
            </div>
            <div class="toggle ${item.enabled ? 'active' : ''}" onclick="toggleNavItem(${index})"></div>
        </div>
    `).join('');
}

function toggleNavItem(index) {
    navMenuItems[index].enabled = !navMenuItems[index].enabled;
    renderNavItems();
}

function saveFooterSettings() {
    const settings = {
        text: document.getElementById('footerText').value,
        date: document.getElementById('footerDate').value,
        navItems: navMenuItems
    };
    localStorage.setItem('lovesite_footer', JSON.stringify(settings));
    showToast('页脚设置保存成功！');
    syncToCloud();
}

function loadFooterSettings() {
    const saved = localStorage.getItem('lovesite_footer');
    if (saved) {
        const s = JSON.parse(saved);
        document.getElementById('footerText').value = s.text || 'Made with ♥';
        document.getElementById('footerDate').value = s.date || 'February 2025';
        if (s.navItems) navMenuItems = s.navItems;
    } else {
        document.getElementById('footerText').value = 'Made with ♥';
        document.getElementById('footerDate').value = 'February 2025';
    }
    renderNavItems();
}

// ============ 数据备份 ============
function exportAllData() {
    const allData = {
        basic: localStorage.getItem('lovesite_basic'),
        password: localStorage.getItem('lovesite_password'),
        theme: localStorage.getItem('lovesite_theme'),
        photos: localStorage.getItem('lovesite_photos'),
        music: localStorage.getItem('lovesite_music'),
        timeline: localStorage.getItem('lovesite_timeline'),
        message: localStorage.getItem('lovesite_message'),
        wishlist: localStorage.getItem('lovesite_wishlist'),
        effects: localStorage.getItem('lovesite_effects'),
        sweetwords: localStorage.getItem('lovesite_sweetwords'),
        footer: localStorage.getItem('lovesite_footer'),
        easterEgg: localStorage.getItem('lovesite_easter_egg')
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `爱情网站备份_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功！');
}

function importData(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                Object.keys(data).forEach(key => {
                    if (data[key]) {
                        localStorage.setItem('lovesite_' + key, data[key]);
                    }
                });
                showToast('数据导入成功！即将刷新页面...');
                setTimeout(() => { syncToCloud(); location.reload(); }, 800);
            } catch (err) {
                showToast('导入失败：文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        const keys = ['basic', 'password', 'theme', 'photos', 'music', 'timeline', 'message', 'broadcast', 'easter_egg', 'wishlist', 'effects', 'sweetwords', 'footer'];
        keys.forEach(key => {
            if (key === 'easter_egg') localStorage.removeItem('lovesite_easter_egg');
            else localStorage.removeItem('lovesite_' + key);
        });
        showToast('数据已清除！即将刷新页面...');
        setTimeout(() => location.reload(), 1500);
    }
}

function updateStats() {
    document.getElementById('photoCount').textContent = photos.length;
    document.getElementById('storyCount').textContent = timelineItems.length;
    document.getElementById('wishCount').textContent = wishItems.length;
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    updateAdminTokenStatus();
    loadBasicSettings();
    loadPasswordSettings();
    loadThemeSettings();
    loadPhotoSettings();
    loadMusicSettings();
    loadTimelineSettings();
    loadMessageSettings();
    loadBroadcastSettings();
    loadEggSettings();
    loadWishlistSettings();
    loadEffectSettings();
    loadSweetwordsSettings();
    loadFooterSettings();
    updateStats();
});
