const EMAILJS_SERVICE_ID = 'qck-pre';
const EMAILJS_TEMPLATE_ID = 'template_jitqy5b';
const EMAILJS_PUBLIC_KEY = 'qxeAf91hjRblcXknk';

const form = document.getElementById('newsletterForm');
const emailInput = document.getElementById('email-input');
const btn = document.getElementById('notify-btn');

const STORAGE_KEY = 'newsletter_emails';
const RATE_KEY = 'newsletter_last_submit';
const RATE_LIMIT_MS = 60_000; // 1 minuto

function isValidEmail(email) {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
}

function setBtn(text, disabled = false) {
    if (!btn) return;
    btn.tagName === 'INPUT' ? btn.value = text : btn.textContent = text;
    btn.disabled = disabled;
}

function alreadySubscribed(email) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return list.includes(email);
}

function saveEmail(email) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
}

function canSubmit() {
    const now = Date.now();
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    if (now - last < RATE_LIMIT_MS) return false;
    localStorage.setItem(RATE_KEY, now);
    return true;
}

if (form) {
    // Honeypot (campo invisível)
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'company';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.style.display = 'none';
    form.appendChild(honeypot);

    try {
        if (EMAILJS_PUBLIC_KEY && window.emailjs?.init) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        }
    } catch {}

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Bot detectado
        if (honeypot.value) return;

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

        if (!canSubmit()) {
            alert(lang === 'pt-br'
                ? 'Aguarde um pouco antes de tentar novamente.'
                : 'Please wait before trying again.');
            return;
        }

        setBtn(lang === 'pt-br' ? 'Enviando...' : 'Sending...', true);

        // IP (best-effort)
        try {
            const r = await fetch('https://api.ipify.org?format=json');
            if (r.ok) {
                const { ip } = await r.json();
                let ipInput = form.querySelector('input[name="ip"]');
                if (!ipInput) {
                    ipInput = document.createElement('input');
                    ipInput.type = 'hidden';
                    ipInput.name = 'ip';
                    form.appendChild(ipInput);
                }
                ipInput.value = ip || '';
            }
        } catch {}

        // user_agent + lang
        ['user_agent', 'lang'].forEach((name) => {
            let i = form.querySelector(`input[name="${name}"]`);
            if (!i) {
                i = document.createElement('input');
                i.type = 'hidden';
                i.name = name;
                form.appendChild(i);
            }
            i.value = name === 'lang' ? lang : navigator.userAgent || '';
        });

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
