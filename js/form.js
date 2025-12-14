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

// ===== espelhos em memória =====
let memoryEmails = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let honeypotMemory = localStorage.getItem(HONEYPOT_KEY) === 'true';

// ===== anti masking (gmail) =====
function normalizeEmail(email) {
    email = email.toLowerCase().trim();
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;

    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        const cleanUser = user.split('+')[0].replace(/\./g, '');
        return `${cleanUser}@gmail.com`;
    }
    return email;
}

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
    return honeypotMemory === true;
}

function markHoneypotTripped() {
    honeypotMemory = true;
    localStorage.setItem(HONEYPOT_KEY, 'true');
}

function showUntrustedMessage(lang) {
    alert(
        lang === 'pt-br'
            ? 'Este navegador foi marcado como não confiável. Tente novamente em outro dispositivo.'
            : 'This browser was marked as untrusted. Please try again on another device.'
    );
}

if (form) {
    // ===== honeypot invisível =====
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'company';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.style.display = 'none';
    honeypot.value = btoa('false'); // base64("false")
    form.appendChild(honeypot);

    // ===== persistência defensiva =====
    setInterval(() => {
        if (!localStorage.getItem(STORAGE_KEY) && memoryEmails.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmails));
        }

        if (!localStorage.getItem(HONEYPOT_KEY) && honeypotMemory === true) {
            localStorage.setItem(HONEYPOT_KEY, 'true');
        }
    }, 1000);

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && !e.newValue && memoryEmails.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmails));
        }

        if (e.key === HONEYPOT_KEY && !e.newValue && honeypotMemory === true) {
            localStorage.setItem(HONEYPOT_KEY, 'true');
        }
    });

    try {
        if (EMAILJS_PUBLIC_KEY && window.emailjs?.init) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        }
    } catch {}

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const lang = navigator.language?.startsWith('pt') ? 'pt-br' : 'en-us';

        // honeypot já tripped
        if (honeypotTripped()) {
            showUntrustedMessage(lang);
            return;
        }

        // valida honeypot
        try {
            const decoded = atob(honeypot.value || '');
            if (decoded !== 'false') {
                markHoneypotTripped();
                showUntrustedMessage(lang);
                return;
            }
        } catch {
            markHoneypotTripped();
            showUntrustedMessage(lang);
            return;
        }

        const rawEmail = String(emailInput?.value || '');
        if (!isValidEmail(rawEmail)) {
            alert(lang === 'pt-br'
                ? 'Por favor, insira um e-mail válido.'
                : 'Please enter a valid email.');
            return;
        }

        const email = normalizeEmail(rawEmail);

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
