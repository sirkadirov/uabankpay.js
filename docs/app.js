import {
    generatePayLink,
    parsePayLink,
    UaBankPayValidationError,
    NBU_QR_BASE_URL,
    MAX_RECEIVER_NAME_LENGTH,
    MAX_RECEIVER_CODE_LENGTH,
    MAX_REFERENCE_LENGTH,
    MAX_DESTINATION_LENGTH,
    MAX_DISPLAY_LENGTH
} from './lib/index.js';

/* ==========================================================================
   Element lookups
   ========================================================================== */

const $ = (id) => document.getElementById(id);

const tabs = $('tab-strip') ?? document.querySelector('.tab-strip');
const tabButtons = Array.from(document.querySelectorAll('.tab'));
const panels = {
    generator: $('panel-generator'),
    parser: $('panel-parser'),
    about: $('panel-about')
};

const form = $('generator-form');
const outputGroup = $('output-group');
const generatedLink = $('generated-link');
const linkLength = $('link-length');
const linkChangeable = $('link-changeable');
const openBtn = $('open-btn');

const qrPreview = $('qr-preview');
const qrImage = $('qr-image');
const qrDownload = $('qr-download');
const qrStatus = $('qr-status');

const parserInput = $('parser-input');
const parserResultGroup = $('parser-result-group');
const parserResultBody = $('parser-result-body');
const roundtripNote = $('roundtrip-note');

const statusBarMessage = $('status-message');
const dialogOverlay = $('dialog-overlay');
const dialogMessage = $('dialog-message');
const dialogOkBtn = $('dialog-ok-btn');

// Maps the library field identifiers to Ukrainian labels. Used both for the
// parsed-request table and for the error dialog so the user never sees code.
const FIELD_LABELS = {
    receiverName: 'Ім\'я отримувача',
    receiverIban: 'IBAN отримувача',
    amount: 'Сума',
    receiverCode: 'Код отримувача',
    destination: 'Призначення',
    reference: 'Референс',
    display: 'Текст для відображення',
    url: 'Посилання'
};

let lastGeneratedLink = '';
let lastDialogTrigger = null;
let statusResetTimer = null;

/* ==========================================================================
   Tabs
   ========================================================================== */

function activateTab(name) {
    for (const button of tabButtons) {
        const isSelected = button.id === `tab-${name}`;
        button.setAttribute('aria-selected', String(isSelected));
        button.tabIndex = isSelected ? 0 : -1;
    }

    for (const [panelName, panel] of Object.entries(panels)) {
        panel.hidden = panelName !== name;
    }
}

for (const button of tabButtons) {
    button.addEventListener('click', () => activateTab(button.id.replace('tab-', '')));
}

tabs?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
    }

    const currentIndex = tabButtons.indexOf(document.activeElement);
    if (currentIndex === -1) {
        return;
    }

    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + tabButtons.length) % tabButtons.length;
    const nextButton = tabButtons[nextIndex];

    nextButton.focus();
    activateTab(nextButton.id.replace('tab-', ''));
});

/* ==========================================================================
   Status bar and dialogs
   ========================================================================== */

function setStatus(message, tone = 'info', temporary = false) {
    clearTimeout(statusResetTimer);
    statusBarMessage.classList.remove('status-message--error', 'status-message--success');
    statusBarMessage.textContent = message;

    if (tone === 'error') {
        statusBarMessage.classList.add('status-message--error');
    } else if (tone === 'success') {
        statusBarMessage.classList.add('status-message--success');
    }

    if (temporary) {
        statusResetTimer = setTimeout(() => setStatus('Готово'), 4000);
    }
}

function labelFor(field) {
    return FIELD_LABELS[field] ?? field;
}

function showDialog(message, trigger) {
    lastDialogTrigger = trigger ?? document.activeElement;
    dialogMessage.textContent = message;
    dialogOverlay.hidden = false;
    dialogOkBtn.focus();
}

function closeDialog() {
    dialogOverlay.hidden = true;

    if (lastDialogTrigger instanceof HTMLElement) {
        lastDialogTrigger.focus();
    }
}

dialogOkBtn.addEventListener('click', closeDialog);

dialogOverlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeDialog();
    } else if (event.key === 'Tab') {
        // The dialog contains a single focusable control; keep Tab cycling inside it.
        event.preventDefault();
    }
});

/* ==========================================================================
   Generator
   ========================================================================== */

function readRequestFromForm() {
    return {
        receiverName: form.elements.receiverName.value.trim(),
        receiverIban: form.elements.receiverIban.value.trim().toUpperCase(),
        amount: form.elements.amount.value.trim(),
        receiverCode: form.elements.receiverCode.value.trim(),
        destination: form.elements.destination.value.trim(),
        reference: form.elements.reference.value.trim(),
        display: form.elements.display.value.trim(),
        changeable: form.elements.changeable.checked
    };
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const request = readRequestFromForm();

    try {
        const link = generatePayLink(request);
        lastGeneratedLink = link;

        generatedLink.textContent = link;
        linkLength.textContent = `${link.length} символів`;
        linkChangeable.textContent = request.changeable
            ? 'Поля дозволено редагувати платником'
            : 'Усі поля заблоковані';
        openBtn.href = link;
        outputGroup.hidden = false;

        resetQrPreview();
        renderQrCode(link).then(() => {
            setStatus('Платіжне посилання та QR-код успішно створені.', 'success', true);
        }, () => setStatus('Платіжне посилання створено. QR-код недоступний.', 'success', true));
    } catch (error) {
        const field = error instanceof UaBankPayValidationError ? labelFor(error.field) : 'Запит';
        const detail = error instanceof UaBankPayValidationError
            ? `Поле «${field}»: ${error.message}`
            : 'Неочікована помилка під час створення платіжного посилання.';
        showDialog(detail, $('generate-btn'));
        setStatus('Створення посилання не вдалося.', 'error');
    }
});

form.addEventListener('reset', () => {
    outputGroup.hidden = true;
    qrPreview.hidden = true;
    lastGeneratedLink = '';
    setStatus('Форму очищено.');
});

$('sample-btn').addEventListener('click', () => {
    form.elements.receiverName.value = 'ГО "Верховний Порядок"';
    form.elements.receiverIban.value = 'UA743077700000026001611157323';
    form.elements.amount.value = 'UAH123.45';
    form.elements.receiverCode.value = '43723254';
    form.elements.destination.value = 'Добровільний внесок на здійснення статутної діяльності ГО "Верховний Порядок"';
    form.elements.reference.value = 'AAABBBCCCDDDEEEFFF1234';
    form.elements.display.value = 'Підтримайте нашу організацію!';
    form.elements.changeable.checked = false;
    setStatus('Завантажено приклад даних отримувача.');
});

$('copy-btn').addEventListener('click', async () => {
    if (!lastGeneratedLink) {
        return;
    }

    try {
        await navigator.clipboard.writeText(lastGeneratedLink);
        setStatus('Посилання скопійовано в буфер обміну.', 'success', true);
    } catch {
        // Clipboard API can be unavailable (insecure context); fall back to a hidden textarea.
        const scratch = document.createElement('textarea');
        scratch.value = lastGeneratedLink;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'fixed';
        scratch.style.opacity = '0';
        document.body.append(scratch);
        scratch.select();

        try {
            document.execCommand('copy');
            setStatus('Посилання скопійовано в буфер обміну.', 'success', true);
        } catch {
            setStatus('Копіювання не вдалося. Виділіть текст посилання вручну.', 'error');
        } finally {
            scratch.remove();
        }
    }
});

function resetQrPreview() {
    qrImage.src = '';
    qrDownload.href = '#';
    qrDownload.hidden = true;
    qrImage.hidden = true;
    qrStatus.textContent = '';
}

let qrLibPromise = null;

function loadQrCodeLib() {
    if (qrLibPromise !== null) {
        return qrLibPromise;
    }

    // Lazily load the `qrcode` library as an ESM module via esm.sh, so the rest
    // of the page never blocks on it. If the network is unavailable the QR
    // preview simply stays hidden and the payment link is still usable.
    return (qrLibPromise = (async () => {
        const module = await import('https://esm.sh/qrcode@1.5.4');
        return module.default ?? module;
    })());
}

async function renderQrCode(link) {
    const QRCode = await loadQrCodeLib();
    const dataUrl = await new Promise((resolve, reject) => {
        QRCode.toDataURL(link, {
            width: 256,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#000', light: '#fff' }
        }, (error, url) => {
            if (error) {
                reject(error);
            } else {
                resolve(url);
            }
        });
    });

    qrImage.src = dataUrl;
    qrImage.hidden = false;
    qrDownload.href = dataUrl;
    qrDownload.hidden = false;
    qrStatus.textContent = '';
    qrPreview.hidden = false;
}

/* ==========================================================================
   Parser
   ========================================================================== */

function describeValue(value, emptyText) {
    const text = String(value ?? '').trim();
    return text === '' ? emptyText : text;
}

function renderParsedRequest(request, sourceUrl) {
    parserResultBody.innerHTML = '';

    for (const key of Object.keys(FIELD_LABELS)) {
        const label = labelFor(key);
        const row = document.createElement('tr');
        const cellLabel = document.createElement('td');
        const cellValue = document.createElement('td');

        cellLabel.textContent = label;
        cellValue.textContent = describeValue(
            request[key],
            key === 'amount' ? '(вводить платник)' : '(не задано)'
        );
        row.append(cellLabel, cellValue);
        parserResultBody.append(row);
    }

    const changeableRow = document.createElement('tr');
    const changeableLabelCell = document.createElement('td');
    const changeableCell = document.createElement('td');
    changeableLabelCell.textContent = 'Редагування';
    changeableCell.textContent = request.changeable
        ? 'Так — платник може редагувати поля'
        : 'Ні — усі поля заблоковані';
    changeableRow.append(changeableLabelCell, changeableCell);
    parserResultBody.append(changeableRow);

    let note;
    if (generatePayLink(request) === sourceUrl) {
        note = 'Верифікація пройшла: повторне створення посилання відтворює його точно.';
    } else {
        note = 'Це посилання створено іншим генератором NBU QR. Вище показаний розшифрований запит; '
            + 'ця бібліотека кодує його з вліми налаштуваннями за замовчуванням '
            + '(транзакція XCT, категорія SUPP/SUPP).';
    }
    roundtripNote.textContent = note;
}

$('parse-btn').addEventListener('click', () => {
    const url = parserInput.value.trim();

    if (!url) {
        setStatus('Спочатку вставте платіжне посилання.', 'error');
        parserInput.focus();
        return;
    }

    try {
        const request = parsePayLink(url);
        parserResultGroup.hidden = false;
        renderParsedRequest(request, url);
        setStatus('Платіжне посилання успішно розшифровано.', 'success', true);
    } catch (error) {
        const field = error instanceof UaBankPayValidationError ? labelFor(error.field) : 'Посилання';
        const detail = error instanceof UaBankPayValidationError
            ? `Поле «${field}»: ${error.message}`
            : 'Неочікована помилка під час розшифрування платіжного посилання.';
        parserResultGroup.hidden = true;
        showDialog(detail, $('parse-btn'));
        setStatus('Розшифрування не вдалося.', 'error');
    }
});

$('paste-sample-btn').addEventListener('click', () => {
    if (!lastGeneratedLink) {
        setStatus('Спочатку створіть посилання, потім розшифруйте його тут.', 'error');
        return;
    }

    parserInput.value = lastGeneratedLink;
    activateTab('parser');
    parserInput.focus();
    setStatus('Посилання вставлено. Натисніть «Розшифрувати», щоб розшифрувати.');
});

/* ==========================================================================
   About panel facts
   ========================================================================== */

$('about-base-url').textContent = NBU_QR_BASE_URL;

const LIMIT_ROWS = [
    ['Ім\'я отримувача', `до ${MAX_RECEIVER_NAME_LENGTH} символів`],
    ['IBAN отримувача', 'UA + 27 цифр (29 символів)'],
    ['Сума', 'префікс UAH за бажанням, до двох десяткових знаків'],
    ['Код отримувача', `8-значний ЄДРПОУ або ${MAX_RECEIVER_CODE_LENGTH}-значний РНОКПП`],
    ['Референс', `до ${MAX_REFERENCE_LENGTH} символів`],
    ['Призначення', `до ${MAX_DESTINATION_LENGTH} символів`],
    ['Текст для відображення', `до ${MAX_DISPLAY_LENGTH} символів`]
];

const limitsTableBody = $('limits-table-body');
for (const [field, limit] of LIMIT_ROWS) {
    const row = document.createElement('tr');
    const fieldCell = document.createElement('td');
    const limitCell = document.createElement('td');
    fieldCell.textContent = field;
    limitCell.textContent = limit;
    row.append(fieldCell, limitCell);
    limitsTableBody.append(row);
}

/* ==========================================================================
   Taskbar
   ========================================================================== */

const clock = $('taskbar-clock');

function updateClock() {
    const now = new Date();
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

updateClock();
setInterval(updateClock, 15000);

$('taskbar-program').addEventListener('click', () => {
    $('program-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('taskbar-start').addEventListener('click', () => {
    activateTab('about');
    $('program-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
