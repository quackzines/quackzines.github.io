const EMAILJS_SERVICE_ID = 'qck-pre';
const EMAILJS_TEMPLATE_ID = 'template_jitqy5b';
const EMAILJS_PUBLIC_KEY = 'qxeAf91hjRblcXknk';

const form = document.getElementById('newsletterForm');
const emailInput = document.getElementById('email-input');
const btn = document.getElementById('notify-btn');

const STORAGE_KEY = 'newsletter_emails';
const RATE_KEY = 'newsletter_last_submit';
const RATE_LIMIT_MS = 60_000; // 1 minuto
const MAX_EMAILS_PER_DEVICE = 5;

// honeypot
const HONEYPOT_KEY = 'newsletter_honeypot_tripped';

// ====== espelho em memória ======
let memoryEmails = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function isValidEmail(email) {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
}

function setBtn(text, disabled = false) {
    if (!btn) return;
    btn.tagName === 'INPUT' ? btn.value = text : btn.textContent = text;
    btn.disabled = disabled;
}

function alreadySubscribed(email) {
    return memoryEmails.includes(email);
}

function reachedDeviceLimit() {
    return memoryEmails.length >= MAX_EMAILS_PER_DEVICE;
}

function saveEmail(email) {
    if (!memoryEmails.includes(email)) {
        memoryEmails.push(email);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmails));
    }
}

function canSubmit() {
    const now = Date.now();
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    if (now - last < RATE_LIMIT_MS) return false;
    localStorage.setItem(RATE_KEY, now);
    return true;
}

// ===== honeypot helpers =====
function honeypotTripped() {
    return localStorage.getItem(HONEYPOT_KEY) === 'true';
}

function markHoneypotTripped() {
    localStorage.setItem(HONEYPOT_KEY, 'true');
}

if (form) {
    // ===== honeypot único (base64) =====
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'company';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.style.display = 'none';

    // base64("false")
    honeypot.value = btoa('false');
    form.appendChild(honeypot);

    // ===== restaura localStorage se apagarem =====
    setInterval(() => {
        const ls = localStorage.getItem(STORAGE_KEY);
        if (!ls && memoryEmails.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmails));
        }
    }, 1000);

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && !e.newValue && memoryEmails.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmails));
        }
    });

    try {
        if (EMAILJS_PUBLIC_KEY && window.emailjs?.init) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        }
    } catch {}

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // honeypot já marcado → bloqueio permanente
        if (honeypotTripped()) return;

        // valida honeypot atual
        try {
            const decoded = atob(honeypot.value || '');
            if (decoded !== 'false') {
                markHoneypotTripped();
                return;
            }
        } catch {
            markHoneypotTripped();
            return;
        }

        const email = String(emailInput?.value || '').trim().toLowerCase();
        const lang = navigator.language?.startsWith('pt') ? 'pt-br' : 'en-us';

        if (!isValidEmail(email)) {
            alert(lang === 'pt-br'
                ? 'Por favor, insira um e-mail válido.'
                : 'Please enter a valid email.');
            return;
        }

        if (alreadySubscribed(email)) {
            alert(lang === 'pt-br'
                ? 'Este e-mail já está cadastrado.'
                : 'This email is already subscribed.');
            return;
        }

        if (reachedDeviceLimit()) {
            alert(lang === 'pt-br'
                ? 'Limite de 5 cadastros atingido neste dispositivo.'
                : 'Device signup limit reached (5 emails).');
            return;
        }

        if (!canSubmit()) {
            alert(lang === 'pt-br'
                ? 'Aguarde um pouco antes de tentar novamente.'
                : 'Please wait before trying again.');
            return;
        }

        setBtn(lang === 'pt-br' ? 'Enviando...' : 'Sending...', true);

        try {
            if (!window.emailjs) throw new Error('EmailJS not loaded');
            await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
            saveEmail(email);
            setBtn(lang === 'pt-br' ? '✓ Enviado!' : '✓ Sent!', true);
        } catch (err) {
            console.error(err);
            setBtn(lang === 'pt-br'
                ? 'Erro — tente novamente'
                : 'Error — try again', false);
            return;
        }

        setTimeout(() => {
            setBtn(lang === 'pt-br' ? 'Notifique-me' : 'Notify Me', false);
            if (emailInput) emailInput.value = '';
        }, 3000);
    });
}
