/* ============ Finals Easter Egg（期末周彩蛋） ============ */
.finals-badge {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 1200;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(232,164,184,0.35);
    backdrop-filter: blur(10px);
    border-radius: 999px;
    padding: 0.6rem 0.9rem;
    font-family: 'ZCOOL XiaoWei', serif;
    letter-spacing: 2px;
    color: var(--text-dark);
    box-shadow: 0 12px 30px rgba(232,164,184,0.18);
    cursor: pointer;
    display: none;
    user-select: none;
}

.finals-badge:hover {
    transform: translateY(-2px);
}

.finals-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 99998;
}

.finals-modal.show { display: flex; }

.finals-modal-card {
    width: min(420px, 92vw);
    background: white;
    border-radius: 22px;
    padding: 2rem 1.6rem;
    box-shadow: 0 30px 70px rgba(0,0,0,0.25);
    text-align: center;
}

.finals-modal-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 2rem;
    margin-bottom: 0.8rem;
    color: var(--text-dark);
}

.finals-modal-content {
    font-family: 'Noto Serif SC', serif;
    color: var(--text-light);
    line-height: 1.9;
    white-space: pre-line;
}

.finals-modal-actions {
    margin-top: 1.4rem;
    display: flex;
    justify-content: center;
    gap: 0.8rem;
}

.finals-btn {
    padding: 0.7rem 1.2rem;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-family: 'ZCOOL XiaoWei', serif;
    letter-spacing: 2px;
}

.finals-btn-primary {
    background: linear-gradient(135deg, var(--primary-pink), var(--soft-purple));
    color: white;
}

.finals-btn-secondary {
    background: rgba(232,164,184,0.12);
    color: var(--text-dark);
}

/* 今日小成就贴纸 */
.finals-stickers {
    margin-top: 1.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
}

.finals-sticker {
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    background: rgba(250,246,242,0.95);
    border: 1px solid rgba(232,164,184,0.25);
    font-family: 'ZCOOL XiaoWei', serif;
    letter-spacing: 1px;
    color: var(--text-dark);
    cursor: pointer;
    transition: all 0.2s ease;
}

.finals-sticker.done {
    background: rgba(127,183,126,0.15);
    border-color: rgba(127,183,126,0.35);
    color: #3d6b3d;
}

.finals-night-tip {
    position: fixed;
    left: 50%;
    bottom: 80px;
    transform: translateX(-50%);
    z-index: 1100;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(232,164,184,0.25);
    backdrop-filter: blur(10px);
    border-radius: 999px;
    padding: 0.6rem 1rem;
    font-family: 'ZCOOL XiaoWei', serif;
    letter-spacing: 2px;
    color: var(--text-light);
    display: none;
    box-shadow: 0 10px 28px rgba(0,0,0,0.10);
}
