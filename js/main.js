
// ============ 密码验证 ============
let SITE_PASSWORD = '20251224';

// 先加载密码设置
function loadPasswordConfig() {
    try {
        const saved = localStorage.getItem('lovesite_password');
        if (saved) {
            const s = JSON.parse(saved);
            SITE_PASSWORD = s.password || '20251224';

            // 更新密码页面文案
            const titleEl = document.querySelector('.password-title');
            const subtitleEl = document.querySelector('.password-subtitle');
            const hintEl = document.querySelector('.password-hint');
            const btnEl = document.querySelector('.password-btn');
            const errorEl = document.getElementById('errorMsg');

            if (titleEl && s.title) titleEl.textContent = s.title;
            if (subtitleEl && s.subtitle) subtitleEl.textContent = s.subtitle;
            if (hintEl && s.hint) hintEl.innerHTML = s.hint;
            if (btnEl && s.btnText) btnEl.innerHTML = s.btnText;
            if (errorEl && s.errorText) errorEl.textContent = s.errorText;
        }
    } catch (e) {
        console.log('加载密码配置失败');
    }
}

// 检查是否已经验证过（使用 sessionStorage，关闭浏览器后失效）
function checkIfUnlocked() {
    return sessionStorage.getItem('site_unlocked') === 'true';
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');

    if (input.value === SITE_PASSWORD) {
        // 密码正确
        sessionStorage.setItem('site_unlocked', 'true');
        unlockSite();
    } else {
        // 密码错误
        input.classList.add('error');
        errorMsg.classList.add('show');

        setTimeout(() => {
            input.classList.remove('error');
        }, 500);

        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 2000);
    }
}

function unlockSite() {
    const passwordScreen = document.getElementById('passwordScreen');
    const mainContent = document.getElementById('mainContent');

    passwordScreen.classList.add('hidden');
    mainContent.classList.add('unlocked');

    // 初始化网站功能
    initializeSite();
}

// 页面加载时先加载密码配置（本地缓存）
loadPasswordConfig();

// 如果已解锁并且 initializeSite 会从云端同步密码配置，等同步完成后再刷新一次密码页文案
async function refreshPasswordConfigFromCloudIfAny() {
    try {
        const res = await fetch('/api/config/get', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.config) return;
        const cloud = (typeof data.config === 'string') ? JSON.parse(data.config) : data.config;
        if (cloud && cloud.password) {
            localStorage.setItem('lovesite_password', JSON.stringify(cloud.password));
            loadPasswordConfig();
        }
    } catch (_) { }
}
refreshPasswordConfigFromCloudIfAny();

// 监听回车键
document.getElementById('passwordInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// 页面加载时检查
if (checkIfUnlocked()) {
    document.getElementById('passwordScreen').classList.add('hidden');
    document.getElementById('mainContent').classList.add('unlocked');
    document.addEventListener('DOMContentLoaded', initializeSite);
}

// ============ 网站初始化 ============
async function initializeSite() {
    // 从管理后台/云端读取配置
    await loadAdminSettings();

    // 应用设置
    applySettings();

    // 隐藏加载动画
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        // 显示甜蜜话语弹窗
        showSweetPopup();
    }, 1000);

    // 启动各种效果
    startTypewriter();
    startLoveCounter();

    // 根据配置启动特效
    if (!CONFIG.effects || CONFIG.effects.petal !== false) {
        startPetalEffect();
    }
    if (!CONFIG.effects || CONFIG.effects.sparkle !== false) {
        startSparkleEffect();
    }

    startAutoSlide();
    initScrollEffects();

    // 检查纪念日
    checkAnniversary();
}

// ============ 配置管理 ============
let CONFIG = {
    loveDate: '2025-12-24',
    typewriterTexts: [
        '时光温柔，记录下我们相遇的每一个瞬间',
        '你是我最美丽的意外',
        '遇见你是我最大的幸运',
        '愿与你共度余生的每一天'
    ],
    siteTitle: '遇见你，真好',
    siteSubtitle: '献给最特别的你',
    photos: [
        { url: 'https://s3.bmp.ovh/imgs/2025/12/28/28a75a5221c3b591.jpg', caption: '每一张照片，都是一段美好的回忆' },
        { url: 'https://s3.bmp.ovh/imgs/2025/12/28/30e3dc68a22e50df.jpg', caption: '你的笑容是我最爱的风景' },
        { url: 'https://s3.bmp.ovh/imgs/2025/12/28/7050e34740e725a1.jpg', caption: '和你在一起的每一刻都很珍贵' },
        { url: 'https://s3.bmp.ovh/imgs/2025/12/28/1cc3f3925001dc79.jpg', caption: '这是我们的故事' }
    ],
    music: {
        title: '晴天',
        artist: '周杰伦',
        url: 'your-music.mp3'
    },
    timeline: [
        { date: '2024年 · 春', title: '初次相遇', content: '缘分让我们在茫茫人海中相遇，那一刻仿佛时间都静止了，我知道你就是我一直在寻找的人。' },
        { date: '2024年 · 夏', title: '渐渐熟悉', content: '从陌生到熟悉，每一次对话都让我更了解你，发现你身上更多美好的特质。' },
        { date: '此刻 · 现在', title: '未来可期', content: '感谢命运的安排，让我遇见了你。期待与你一起，书写更多美好的篇章。' }
    ],
    message: {
        content: '感谢你出现在我的生命里\n让平凡的日子闪闪发光\n愿未来的每一天\n都有你的陪伴',
        signature: '写给最特别的你'
    },
    // 新增配置
    theme: {
        primary: '#e8a4b8',
        secondary: '#f5d0d8',
        bg: '#faf6f2',
        text: '#4a3f44'
    },
    wishlist: {
        enabled: true,
        items: [
            { text: '一起看一场日出', completed: false },
            { text: '去一个新的城市旅行', completed: false }
        ]
    },
    effects: {
        petal: true,
        sparkle: true,
        heart: true,
        firework: true,
        fireworkDates: '12-24, 02-14, 05-20'
    },
    sweetwords: {
        enabled: true,
        frequency: 'always',
        messages: [
            '今天也要爱你多一点 💕',
            '有你的日子，每天都是情人节',
            '你是我生命中最美的意外'
        ]
    },
    footer: {
        text: 'Made with ♥',
        date: 'February 2025'
    },
    broadcast: {
        enabled: true,
        items: [
            {
                enabled: true,
                priority: 10,
                tag: '期末加油',
                title: '期末周加油',
                content: '不管考得怎样，你已经很努力了。\n我一直站在你这边。\n记得按时吃饭、早点睡。',
                startDate: '',
                endDate: '',
                countdownDate: ''
            }
        ]
    },
    easterEgg: {
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
    },
};

async function loadAdminSettings() {
    // 1) 优先从云端拉取（跨设备同步）
    try {
        const res = await fetch('/api/config/get', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data && data.config) {
                // 兼容：如果后端返回的是 JSON 字符串，这里解析
                const cloudConfig = (typeof data.config === 'string') ? JSON.parse(data.config) : data.config;
                applyCloudConfigToLocal(cloudConfig);
                return;
            }
        }
    } catch (e) {
        // 云端不可用时回落到本地
    }

    // 2) 回落到本地 localStorage（离线/首次）
    try {
        const basicSettings = localStorage.getItem('lovesite_basic');
        if (basicSettings) {
            const basic = JSON.parse(basicSettings);
            if (basic.loveDate) CONFIG.loveDate = basic.loveDate;
            if (basic.typewriterTexts) CONFIG.typewriterTexts = basic.typewriterTexts;
            if (basic.siteTitle) CONFIG.siteTitle = basic.siteTitle;
            if (basic.siteSubtitle) CONFIG.siteSubtitle = basic.siteSubtitle;
        }

        const photoSettings = localStorage.getItem('lovesite_photos');
        if (photoSettings) {
            CONFIG.photos = JSON.parse(photoSettings);
        }

        const musicSettings = localStorage.getItem('lovesite_music');
        if (musicSettings) {
            const music = JSON.parse(musicSettings);
            if (music.title) CONFIG.music.title = music.title;
            if (music.artist) CONFIG.music.artist = music.artist;
            if (music.url) CONFIG.music.url = music.url;
        }

        const timelineSettings = localStorage.getItem('lovesite_timeline');
        if (timelineSettings) {
            CONFIG.timeline = JSON.parse(timelineSettings);
        }

        const messageSettings = localStorage.getItem('lovesite_message');
        if (messageSettings) {
            CONFIG.message = JSON.parse(messageSettings);
        }

        // 加载主题设置
        const themeSettings = localStorage.getItem('lovesite_theme');
        if (themeSettings) {
            CONFIG.theme = JSON.parse(themeSettings);
        }

        // 加载心愿清单
        const wishlistSettings = localStorage.getItem('lovesite_wishlist');
        if (wishlistSettings) {
            CONFIG.wishlist = JSON.parse(wishlistSettings);
        }

        // 加载特效设置
        const effectSettings = localStorage.getItem('lovesite_effects');
        if (effectSettings) {
            CONFIG.effects = JSON.parse(effectSettings);
        }

        // 加载甜蜜话语
        const sweetwordsSettings = localStorage.getItem('lovesite_sweetwords');
        if (sweetwordsSettings) {
            CONFIG.sweetwords = JSON.parse(sweetwordsSettings);
        }

        // 加载页脚设置
        const footerSettings = localStorage.getItem('lovesite_footer');
        if (footerSettings) {
            CONFIG.footer = JSON.parse(footerSettings);
        }

        // 加载广播站
        const broadcastSettings = localStorage.getItem('lovesite_broadcast');
        if (broadcastSettings) {
            CONFIG.broadcast = JSON.parse(broadcastSettings);
        }
        const eggSettings = localStorage.getItem('lovesite_easter_egg');
        if (eggSettings) {
            CONFIG.easterEgg = JSON.parse(eggSettings);
        }
    } catch (e) {
        console.log('加载设置失败，使用默认配置');
    }
}

function applyCloudConfigToLocal(cloud) {
    // cloud 格式：{ basic, photos, music, timeline, message, password, theme, wishlist, effects, sweetwords, footer }
    try {
        if (cloud.basic) {
            const basic = cloud.basic;
            if (basic.loveDate) CONFIG.loveDate = basic.loveDate;
            if (basic.typewriterTexts) CONFIG.typewriterTexts = basic.typewriterTexts;
            if (typeof basic.siteTitle === 'string') CONFIG.siteTitle = basic.siteTitle;
            if (typeof basic.siteSubtitle === 'string') CONFIG.siteSubtitle = basic.siteSubtitle;

            // 同步到本地缓存
            localStorage.setItem('lovesite_basic', JSON.stringify(basic));
        }

        if (cloud.photos) {
            CONFIG.photos = cloud.photos;
            localStorage.setItem('lovesite_photos', JSON.stringify(cloud.photos));
        }

        if (cloud.music) {
            CONFIG.music = { ...CONFIG.music, ...cloud.music };
            localStorage.setItem('lovesite_music', JSON.stringify(cloud.music));
        }

        if (cloud.timeline) {
            CONFIG.timeline = cloud.timeline;
            localStorage.setItem('lovesite_timeline', JSON.stringify(cloud.timeline));
        }

        if (cloud.message) {
            CONFIG.message = cloud.message;
            localStorage.setItem('lovesite_message', JSON.stringify(cloud.message));
        }

        if (cloud.password) {
            localStorage.setItem('lovesite_password', JSON.stringify(cloud.password));
        }

        if (cloud.theme) {
            CONFIG.theme = cloud.theme;
            localStorage.setItem('lovesite_theme', JSON.stringify(cloud.theme));
        }

        if (cloud.wishlist) {
            CONFIG.wishlist = cloud.wishlist;
            localStorage.setItem('lovesite_wishlist', JSON.stringify(cloud.wishlist));
        }

        if (cloud.effects) {
            CONFIG.effects = cloud.effects;
            localStorage.setItem('lovesite_effects', JSON.stringify(cloud.effects));
        }

        if (cloud.sweetwords) {
            CONFIG.sweetwords = cloud.sweetwords;
            localStorage.setItem('lovesite_sweetwords', JSON.stringify(cloud.sweetwords));
        }

        if (cloud.footer) {
            CONFIG.footer = cloud.footer;
            localStorage.setItem('lovesite_footer', JSON.stringify(cloud.footer));
        }

        if (cloud.broadcast) {
            CONFIG.broadcast = cloud.broadcast;
            localStorage.setItem('lovesite_broadcast', JSON.stringify(cloud.broadcast));
        }
        if (cloud.easterEgg) {
            CONFIG.easterEgg = cloud.easterEgg;
            localStorage.setItem('lovesite_easter_egg', JSON.stringify(cloud.easterEgg));
        }
    } catch (e) {
        console.log('应用云端配置失败');
    }
}


function applySettings() {
    // 应用标题
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroTitle) heroTitle.textContent = CONFIG.siteTitle;
    if (heroSubtitle) heroSubtitle.textContent = CONFIG.siteSubtitle;
    document.title = CONFIG.siteTitle;

    // 应用音乐
    const musicTitle = document.querySelector('.music-title');
    const musicArtist = document.querySelector('.music-artist');
    if (musicTitle) musicTitle.textContent = CONFIG.music.title;
    if (musicArtist) musicArtist.textContent = CONFIG.music.artist;

    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic && CONFIG.music.url) {
        bgMusic.src = CONFIG.music.url;
    }

    // 应用心语
    const messageContent = document.querySelector('.message-content');
    const messageSignature = document.querySelector('.message-signature');
    if (messageContent) {
        messageContent.innerHTML = CONFIG.message.content.split('\n').join('<br>');
    }
    if (messageSignature) {
        messageSignature.textContent = CONFIG.message.signature;
    }

    // 应用主题颜色
    if (CONFIG.theme) {
        document.documentElement.style.setProperty('--primary-pink', CONFIG.theme.primary || '#e8a4b8');
        document.documentElement.style.setProperty('--secondary-pink', CONFIG.theme.secondary || '#f5d0d8');
        document.documentElement.style.setProperty('--warm-cream', CONFIG.theme.bg || '#faf6f2');
        document.documentElement.style.setProperty('--text-dark', CONFIG.theme.text || '#4a3f44');
    }

    // 应用页脚
    applyFooterAndNav();

    // 应用相册/时间轴（完全由后台控制数量）
    renderPhotosFromConfig();
    renderTimelineFromConfig();

    // 应用小小广播站（只显示当前最适合的一条）
    renderBroadcastFromConfig();
    EasterEgg.init(CONFIG.easterEgg);

    // 应用心愿清单
    if (CONFIG.wishlist && CONFIG.wishlist.enabled) {
        renderWishlist();
    }
}

function applyFooterAndNav() {
    // footer
    if (CONFIG.footer) {
        const footerTextEl = document.getElementById('footerText');
        const footerDateEl = document.getElementById('footerDate');

        const text = (typeof CONFIG.footer.text === 'string') ? CONFIG.footer.text : 'Made with ♥';
        const date = (typeof CONFIG.footer.date === 'string') ? CONFIG.footer.date : 'February 2025';

        if (footerDateEl) footerDateEl.textContent = date;
        // footerText 里原本包含 ♥ 的 span，这里保持结构：只替换整句
        if (footerTextEl) {
            footerTextEl.innerHTML = `${escapeHtml(text).replace('♥', '<span>♥</span>')} <span id="footerDate">${escapeHtml(date)}</span>`;
        }
    }

    // nav
    const navMenu = document.getElementById('navMenu');
    if (navMenu && CONFIG.footer && Array.isArray(CONFIG.footer.navItems)) {
        const items = CONFIG.footer.navItems.filter(i => i && i.enabled !== false && i.href && i.name);
        if (items.length > 0) {
            navMenu.innerHTML = items.map(i => `<li><a href="${escapeAttr(i.href)}">${escapeHtml(i.name)}</a></li>`).join('');
        }
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
function escapeAttr(str) {
    // href only
    return String(str).replaceAll('"', '%22');
}

function renderPhotosFromConfig() {
    if (!Array.isArray(CONFIG.photos) || CONFIG.photos.length === 0) return;

    const slider = document.querySelector('.photo-slider');
    const thumbnailsWrap = document.querySelector('.photo-thumbnails');
    const dotsWrap = document.querySelector('.slider-controls');
    const caption = document.getElementById('photoCaption');
    if (!slider || !dotsWrap || !caption) return;

    // 移除旧的图片节点（保留 caption/arrows/dots 容器）
    slider.querySelectorAll('img.photo').forEach(n => n.remove());

    // 生成图片
    CONFIG.photos.forEach((p, idx) => {
        const img = document.createElement('img');
        img.src = p.url;
        img.className = 'photo' + (idx === 0 ? ' active' : '');
        img.alt = `我们的照片${idx + 1}`;
        slider.insertBefore(img, caption);
    });

    // dots
    dotsWrap.innerHTML = CONFIG.photos.map((_, idx) => {
        return `<button class="slider-dot ${idx === 0 ? 'active' : ''}" onclick="showPhoto(${idx})"></button>`;
    }).join('');

    // thumbnails
    if (thumbnailsWrap) {
        thumbnailsWrap.innerHTML = CONFIG.photos.map((p, idx) => {
            return `<img src="${escapeAttr(p.url)}" class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="showPhoto(${idx})" alt="缩略图${idx + 1}">`;
        }).join('');
    }

    caption.textContent = CONFIG.photos[0]?.caption || '每一张照片，都是一段美好的回忆';
    currentPhoto = 0;
    resetAutoSlide();
}

function renderTimelineFromConfig() {
    if (!Array.isArray(CONFIG.timeline) || CONFIG.timeline.length === 0) return;
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    timeline.innerHTML = CONFIG.timeline.map((item) => {
        const date = item?.date ?? '';
        const title = item?.title ?? '';
        const content = item?.content ?? '';
        return `
            <div class="timeline-item fade-in">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-card">
                        <p class="timeline-date">${escapeHtml(date)}</p>
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(content)}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderBroadcastFromConfig() {
    const card = document.getElementById('broadcastCard');
    if (!card) return;

    const cfg = CONFIG.broadcast;
    if (!cfg || cfg.enabled === false || !Array.isArray(cfg.items) || cfg.items.length === 0) {
        card.style.display = 'none';
        return;
    }

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const candidates = cfg.items
        .filter(i => i && i.enabled !== false)
        .filter(i => {
            const s = i.startDate ? new Date(i.startDate) : null;
            const e = i.endDate ? new Date(i.endDate) : null;
            const sd = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()) : null;
            const ed = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()) : null;

            if (sd && todayDate < sd) return false;
            if (ed && todayDate > ed) return false;
            return true;
        })
        .sort((a, b) => (Number(b.priority || 0) - Number(a.priority || 0)));

    const chosen = candidates[0];
    if (!chosen) {
        card.style.display = 'none';
        return;
    }

    // 填充
    const tagEl = document.getElementById('broadcastTag');
    const titleEl = document.getElementById('broadcastTitle');
    const contentEl = document.getElementById('broadcastContent');
    const countdownEl = document.getElementById('broadcastCountdown');
    const daysEl = document.getElementById('broadcastDays');

    if (tagEl) {
        const tag = (chosen.tag || '').trim();
        tagEl.style.display = tag ? 'inline-block' : 'none';
        tagEl.textContent = tag;
    }
    if (titleEl) titleEl.textContent = chosen.title || '';
    if (contentEl) contentEl.textContent = chosen.content || '';

    // 倒计时（可选）
    if (countdownEl && daysEl) {
        const cd = chosen.countdownDate ? new Date(chosen.countdownDate) : null;
        if (cd && !isNaN(cd.getTime())) {
            const cdd = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
            const diff = cdd - todayDate;
            const days = Math.round(diff / (1000 * 60 * 60 * 24));
            countdownEl.style.display = 'block';
            daysEl.textContent = String(days);
        } else {
            countdownEl.style.display = 'none';
        }
    }

    card.style.display = 'block';
}

// ============ 心愿清单 ============
function renderWishlist() {
    const section = document.getElementById('wishlist');
    const container = document.getElementById('wishlistContainer');
    if (!section || !container || !CONFIG.wishlist) return;

    if (CONFIG.wishlist.enabled && CONFIG.wishlist.items && CONFIG.wishlist.items.length > 0) {
        section.style.display = 'block';

        const completed = CONFIG.wishlist.items.filter(i => i.completed).length;
        const total = CONFIG.wishlist.items.length;
        const percent = total > 0 ? (completed / total * 100) : 0;

        document.getElementById('wishCompleted').textContent = completed;
        document.getElementById('wishTotal').textContent = total;
        document.getElementById('wishProgressFill').style.width = percent + '%';

        container.innerHTML = CONFIG.wishlist.items.map(item => `
            <div class="wish-item">
                <div class="wish-checkbox ${item.completed ? 'checked' : ''}"></div>
                <span class="wish-text ${item.completed ? 'completed' : ''}">${item.text}</span>
            </div>
        `).join('');
    }
}

// ============ 甜蜜话语弹窗 ============
function showSweetPopup() {
    if (!CONFIG.sweetwords || !CONFIG.sweetwords.enabled) return;

    const freq = CONFIG.sweetwords.frequency || 'always';
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('sweetword_lastshown');

    let shouldShow = false;
    if (freq === 'always') {
        shouldShow = true;
    } else if (freq === 'daily' && lastShown !== today) {
        shouldShow = true;
    } else if (freq === 'random' && Math.random() < 0.3) {
        shouldShow = true;
    }

    if (shouldShow && CONFIG.sweetwords.messages && CONFIG.sweetwords.messages.length > 0) {
        const randomMsg = CONFIG.sweetwords.messages[Math.floor(Math.random() * CONFIG.sweetwords.messages.length)];
        document.getElementById('sweetPopupText').textContent = randomMsg;

        setTimeout(() => {
            document.getElementById('sweetPopup').classList.add('show');
            localStorage.setItem('sweetword_lastshown', today);
        }, 2000);
    }
}

function closeSweetPopup() {
    document.getElementById('sweetPopup').classList.remove('show');
}

// ============ 烟花特效 ============
function createFirework(x, y) {
    const container = document.getElementById('fireworkContainer');
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (Math.PI * 2 / 30) * i;
        const velocity = 50 + Math.random() * 100;
        particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

function launchFireworks() {
    const count = 5;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = 100 + Math.random() * (window.innerHeight / 2);
            createFirework(x, y);
        }, i * 500);
    }
}

function checkAnniversary() {
    if (!CONFIG.effects || !CONFIG.effects.firework) return;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}-${day}`;

    const dates = (CONFIG.effects.fireworkDates || '').split(',').map(d => d.trim());

    if (dates.includes(todayStr)) {
        document.getElementById('anniversaryBanner').classList.add('show');
        launchFireworks();

        // 每隔几秒放一次烟花
        setInterval(launchFireworks, 8000);
    }
}

// ============ 打字机效果 ============
let typewriterIndex = 0;
let charIndex = 0;
let isDeleting = false;

function startTypewriter() {
    const element = document.getElementById('typewriter');
    if (!element) return;

    function type() {
        const texts = CONFIG.typewriterTexts;
        const currentText = texts[typewriterIndex];

        if (isDeleting) {
            element.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            element.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            typewriterIndex = (typewriterIndex + 1) % texts.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    setTimeout(type, 1000);
}

// ============ 恋爱计数器 ============
function startLoveCounter() {
    function update() {
        const now = new Date();
        const startDate = new Date(CONFIG.loveDate);
        const diff = now - startDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('daysCount');
        const hoursEl = document.getElementById('hoursCount');
        const minutesEl = document.getElementById('minutesCount');
        const secondsEl = document.getElementById('secondsCount');

        if (daysEl) daysEl.textContent = Math.max(0, days);
        if (hoursEl) hoursEl.textContent = Math.max(0, hours);
        if (minutesEl) minutesEl.textContent = Math.max(0, minutes);
        if (secondsEl) secondsEl.textContent = Math.max(0, seconds);
    }

    update();
    setInterval(update, 1000);
}

// ============ 飘落花瓣效果 ============
function startPetalEffect() {
    const container = document.getElementById('petalContainer');
    if (!container) return;

    const petalTypes = ['🌸', '💕', '✿', '❀', '♡'];

    function createPetal() {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.innerHTML = `<span style="font-size: ${Math.random() * 15 + 10}px; opacity: ${Math.random() * 0.5 + 0.3}">${petalTypes[Math.floor(Math.random() * petalTypes.length)]}</span>`;
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 5 + 8) + 's';
        petal.style.animationDelay = Math.random() * 2 + 's';

        container.appendChild(petal);

        setTimeout(() => petal.remove(), 15000);
    }

    setInterval(createPetal, 800);
    for (let i = 0; i < 10; i++) {
        setTimeout(createPetal, i * 200);
    }
}

// ============ 鼠标跟随星光 ============
function startSparkleEffect() {
    let lastTime = 0;

    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTime < 50) return;
        lastTime = now;

        const sparkle = document.createElement('div');
        sparkle.className = 'cursor-sparkle';
        sparkle.innerHTML = ['✦', '✧', '★', '☆', '✴', '❋'][Math.floor(Math.random() * 6)];
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        sparkle.style.fontSize = (Math.random() * 8 + 8) + 'px';

        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    });
}

// ============ 照片轮播 ============
let currentPhoto = 0;
let autoSlideInterval;

function showPhoto(index) {
    const photos = document.querySelectorAll('.photo');
    const dots = document.querySelectorAll('.slider-dot');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const caption = document.getElementById('photoCaption');

    if (photos.length === 0) return;

    photos.forEach(p => p.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    thumbnails.forEach(t => t.classList.remove('active'));

    currentPhoto = index;
    if (currentPhoto >= photos.length) currentPhoto = 0;
    if (currentPhoto < 0) currentPhoto = photos.length - 1;

    if (photos[currentPhoto]) photos[currentPhoto].classList.add('active');
    if (dots[currentPhoto]) dots[currentPhoto].classList.add('active');
    if (thumbnails[currentPhoto]) thumbnails[currentPhoto].classList.add('active');

    if (caption && CONFIG.photos[currentPhoto]) {
        caption.textContent = CONFIG.photos[currentPhoto].caption;
    }

    resetAutoSlide();
}

function nextPhoto() { showPhoto(currentPhoto + 1); }
function prevPhoto() { showPhoto(currentPhoto - 1); }

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(nextPhoto, 5000);
}

function startAutoSlide() {
    autoSlideInterval = setInterval(nextPhoto, 5000);
}

// ============ 音乐控制 ============
let isPlaying = false;
let isMuted = false;

function toggleMusic() {
    const bgMusic = document.getElementById('bgMusic');
    const playIcon = document.getElementById('playIcon');
    const vinylDisc = document.getElementById('vinylDisc');

    if (isPlaying) {
        bgMusic.pause();
        playIcon.textContent = '▶';
        vinylDisc.classList.remove('spinning');
    } else {
        bgMusic.play().catch(() => console.log('需要用户交互'));
        playIcon.textContent = '❚❚';
        vinylDisc.classList.add('spinning');
    }
    isPlaying = !isPlaying;
}

function prevSong() { document.getElementById('bgMusic').currentTime = 0; }
function nextSong() { document.getElementById('bgMusic').currentTime = 0; }

function seekMusic(e) {
    const bar = document.getElementById('progressBar');
    const music = document.getElementById('bgMusic');
    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    music.currentTime = pos * music.duration;
}

function changeVolume(value) {
    const music = document.getElementById('bgMusic');
    music.volume = value / 100;
    updateVolumeIcon(value);
}

function toggleMute() {
    const music = document.getElementById('bgMusic');
    const icon = document.getElementById('volumeIcon');
    isMuted = !isMuted;
    music.muted = isMuted;
    icon.textContent = isMuted ? '🔇' : '🔊';
}

function updateVolumeIcon(value) {
    const icon = document.getElementById('volumeIcon');
    if (value == 0) icon.textContent = '🔇';
    else if (value < 50) icon.textContent = '🔉';
    else icon.textContent = '🔊';
}

// 进度条更新
document.getElementById('bgMusic')?.addEventListener('timeupdate', function () {
    if (this.duration) {
        const progress = (this.currentTime / this.duration) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('currentTime').textContent = formatTime(this.currentTime);
    }
});

document.getElementById('bgMusic')?.addEventListener('loadedmetadata', function () {
    document.getElementById('totalTime').textContent = formatTime(this.duration);
});

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============ 滚动效果 ============
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }

        if (window.scrollY > 500) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
    });

    // 滚动动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 平滑滚动
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // 移动端菜单
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    mobileBtn?.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ============ EasterEgg（通用彩蛋）===========
const EasterEgg = (() => {
    const LS_KEY = 'easteregg_stickers_state_v1';

    const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const parseDate = (str) => {
        if (!str) return null;
        const d = new Date(str);
        if (isNaN(d.getTime())) return null;
        return toDateOnly(d);
    };
    const inRange = (today, start, end) => {
        if (start && today < start) return false;
        if (end && today > end) return false;
        return true;
    };

    const todayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const loadState = () => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return { day: todayKey(), done: {} };
            const s = JSON.parse(raw);
            if (s.day !== todayKey()) return { day: todayKey(), done: {} };
            return s;
        } catch {
            return { day: todayKey(), done: {} };
        }
    };

    const saveState = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

    const pickCheer = (cfg) => {
        const list = Array.isArray(cfg.cheerMessages) && cfg.cheerMessages.length
            ? cfg.cheerMessages
            : ['你已经很努力了。\n我一直在你身边。'];
        return list[Math.floor(Math.random() * list.length)];
    };

    const renderStickers = (cfg) => {
        const wrap = document.getElementById('eggStickers');
        if (!wrap) return;
        const state = loadState();
        const items = Array.isArray(cfg.stickers) && cfg.stickers.length ? cfg.stickers : [];

        wrap.innerHTML = items.map(it => {
            const done = !!state.done[it.id];
            return `<div class="finals-sticker ${done ? 'done' : ''}" data-id="${it.id}">${done ? '✓ ' : ''}${it.text}</div>`;
        }).join('');

        wrap.querySelectorAll('.finals-sticker').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const s = loadState();
                s.done[id] = !s.done[id];
                saveState(s);
                renderStickers(cfg);
            });
        });
    };

    const showNightTip = (cfg) => {
        const tip = document.getElementById('eggNightTip');
        if (!tip) return;

        const hour = new Date().getHours();
        const enabled = cfg.nightTipEnabled !== false;
        const inNight = (hour >= 23 || hour <= 2);

        if (enabled && inNight) {
            tip.textContent = cfg.nightTipText || '该休息啦，明天也会继续为你加油。';
            tip.style.display = 'block';
            setTimeout(() => { tip.style.display = 'none'; }, 6000);
        } else {
            tip.style.display = 'none';
        }
    };

    const showModal = (cfg) => {
        const modal = document.getElementById('eggModal');
        const titleEl = document.getElementById('eggModalTitle');
        const contentEl = document.getElementById('eggModalContent');

        if (titleEl) titleEl.textContent = cfg.cheerTitle || '你真的很棒';
        if (contentEl) contentEl.textContent = pickCheer(cfg);

        renderStickers(cfg);
        modal?.classList.add('show');
    };

    const hideModal = () => document.getElementById('eggModal')?.classList.remove('show');

    function init(cfg) {
        if (!cfg || cfg.enabled === false) return;

        const today = toDateOnly(new Date());
        const start = parseDate(cfg.startDate);
        const end = parseDate(cfg.endDate);

        if (!inRange(today, start, end)) return;

        const badge = document.getElementById('eggBadge');
        if (badge) {
            badge.textContent = cfg.badgeText || '✨ 彩蛋';
            badge.style.display = 'block';
            badge.addEventListener('click', () => showModal(cfg));
        }

        document.getElementById('eggModalClose')?.addEventListener('click', hideModal);
        document.getElementById('eggModalCheer')?.addEventListener('click', () => {
            const contentEl = document.getElementById('eggModalContent');
            if (contentEl) contentEl.textContent = pickCheer(cfg);
        });

        document.getElementById('eggModal')?.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'eggModal') hideModal();
        });

        showNightTip(cfg);
    }

    return { init };
})();

// ============ 控制台彩蛋 ============
console.log('%c💕 送给我的最爱 💕', 'color: #e8a4b8; font-size: 20px; font-weight: bold;');
