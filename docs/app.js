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

const parserInput = $('parser-input');
const parserResultGroup = $('parser-result-group');
const parserResultBody = $('parser-result-body');
const roundtripNote = $('roundtrip-note');

const statusBarMessage = $('status-message');
const dialogOverlay = $('dialog-overlay');
const dialogMessage = $('dialog-message');
const dialogOkBtn = $('dialog-ok-btn');

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
        statusResetTimer = setTimeout(() => setStatus('Ready'), 4000);
    }
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
        linkLength.textContent = `${link.length} characters`;
        linkChangeable.textContent = request.changeable
            ? 'Fields editable by payer'
            : 'All fields locked';
        openBtn.href = link;
        outputGroup.hidden = false;

        setStatus('Payment link generated successfully.', 'success', true);
    } catch (error) {
        const detail = error instanceof UaBankPayValidationError
            ? `Field "${error.field}": ${error.message}`
            : 'Unexpected error while generating the payment link.';
        showDialog(detail, $('generate-btn'));
        setStatus('Generation failed.', 'error');
    }
});

form.addEventListener('reset', () => {
    outputGroup.hidden = true;
    lastGeneratedLink = '';
    setStatus('Form cleared.');
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
    setStatus('Sample payee details loaded.');
});

$('copy-btn').addEventListener('click', async () => {
    if (!lastGeneratedLink) {
        return;
    }

    try {
        await navigator.clipboard.writeText(lastGeneratedLink);
        setStatus('Link copied to clipboard.', 'success', true);
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
            setStatus('Link copied to clipboard.', 'success', true);
        } catch {
            setStatus('Copying failed. Select the link text manually.', 'error');
        } finally {
            scratch.remove();
        }
    }
});

/* ==========================================================================
   Parser
   ========================================================================== */

const FIELD_LABELS = [
    ['receiverName', 'Receiver name'],
    ['receiverIban', 'Receiver IBAN'],
    ['amount', 'Amount'],
    ['receiverCode', 'Receiver code'],
    ['destination', 'Destination'],
    ['reference', 'Reference'],
    ['display', 'Display text']
];

function describeValue(value, emptyText) {
    const text = String(value ?? '').trim();
    return text === '' ? emptyText : text;
}

function renderParsedRequest(request, sourceUrl) {
    parserResultBody.innerHTML = '';

    for (const [key, label] of FIELD_LABELS) {
        const row = document.createElement('tr');
        const cellLabel = document.createElement('td');
        const cellValue = document.createElement('td');

        cellLabel.textContent = label;
        cellValue.textContent = describeValue(
            request[key],
            key === 'amount' ? '(payer chooses)' : '(not set)'
        );
        row.append(cellLabel, cellValue);
        parserResultBody.append(row);
    }

    const changeableRow = document.createElement('tr');
    const changeableLabelCell = document.createElement('td');
    const changeableCell = document.createElement('td');
    changeableLabelCell.textContent = 'Changeable';
    changeableCell.textContent = request.changeable ? 'Yes - payer may edit fields' : 'No - all fields locked';
    changeableRow.append(changeableLabelCell, changeableCell);
    parserResultBody.append(changeableRow);

    let note;
    if (generatePayLink(request) === sourceUrl) {
        note = 'Round-trip verified: regenerating this request reproduces the exact link.';
    } else {
        note = 'This link was produced by another NBU QR generator. The decoded request is shown above; '
            + 'this library would encode it with its own defaults (XCT transaction type, SUPP/SUPP category).';
    }
    roundtripNote.textContent = note;
}

$('parse-btn').addEventListener('click', () => {
    const url = parserInput.value.trim();

    if (!url) {
        setStatus('Paste a payment link first.', 'error');
        parserInput.focus();
        return;
    }

    try {
        const request = parsePayLink(url);
        parserResultGroup.hidden = false;
        renderParsedRequest(request, url);
        setStatus('Payment link parsed successfully.', 'success', true);
    } catch (error) {
        const detail = error instanceof UaBankPayValidationError
            ? error.message
            : 'Unexpected error while parsing the payment link.';
        parserResultGroup.hidden = true;
        showDialog(detail, $('parse-btn'));
        setStatus('Parsing failed.', 'error');
    }
});

$('paste-sample-btn').addEventListener('click', () => {
    if (!lastGeneratedLink) {
        setStatus('Generate a link first, then decode it here.', 'error');
        return;
    }

    parserInput.value = lastGeneratedLink;
    activateTab('parser');
    parserInput.focus();
    setStatus('Generated link inserted. Press "Parse link" to decode it.');
});

/* ==========================================================================
   About panel facts
   ========================================================================== */

$('about-base-url').textContent = NBU_QR_BASE_URL;

const LIMIT_ROWS = [
    ['Receiver name', `up to ${MAX_RECEIVER_NAME_LENGTH} characters`],
    ['Receiver IBAN', 'exactly UA + 27 digits (29 characters)'],
    ['Amount', 'UAH prefix optional, up to two decimal places'],
    ['Receiver code', `8-digit EDRPOU or ${MAX_RECEIVER_CODE_LENGTH}-digit RNOKPP`],
    ['Reference', `up to ${MAX_REFERENCE_LENGTH} characters`],
    ['Destination', `up to ${MAX_DESTINATION_LENGTH} characters`],
    ['Display text', `up to ${MAX_DISPLAY_LENGTH} characters`]
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
