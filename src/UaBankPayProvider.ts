import type { UaBankPayLinkRequest } from './UaBankPayLinkRequest.js';
import { UaBankPayValidationError } from './UaBankPayValidationError.js';
import {
    DEFAULT_CATEGORY,
    LOCK_ALL_FIELDS_MASK,
    MAX_DESTINATION_LENGTH,
    MAX_DISPLAY_LENGTH,
    MAX_RECEIVER_CODE_LENGTH,
    MAX_RECEIVER_NAME_LENGTH,
    MAX_REFERENCE_LENGTH,
    NBU_QR_BASE_URL,
    NBU_QR_SPEC_VERSION
} from './constants.js';
import { encodeBase64Url } from './base64url.js';

/** Ukrainian IBAN: country code `UA` followed by 27 digits (29 characters in total). */
const IBAN_PATTERN = /^UA\d{27}$/;

/** Receiver code: 8-digit EDRPOU or 10-digit RNOKPP. */
const RECEIVER_CODE_PATTERN = /^\d{8}(?:\d{2})?$/;

/**
 * Payment amount: optional three-letter ISO 4217 currency code followed by a
 * positive decimal number with up to nine integer digits and up to two
 * fractional digits (e.g. `UAH123.45` or `123.45`).
 */
const AMOUNT_PATTERN = /^([A-Z]{3})?(\d{1,9})(?:\.(\d{1,2}))?$/;

function validateReceiverName(receiverName: string): void {
    if (!receiverName) {
        throw new UaBankPayValidationError('receiverName', 'Receiver name is required');
    }
    if (receiverName.length > MAX_RECEIVER_NAME_LENGTH) {
        throw new UaBankPayValidationError(
            'receiverName',
            `Receiver name exceeds maximum length of ${MAX_RECEIVER_NAME_LENGTH} characters`
        );
    }
}

function validateReceiverIban(receiverIban: string): void {
    if (!receiverIban) {
        throw new UaBankPayValidationError('receiverIban', 'Receiver IBAN is required');
    }
    if (!IBAN_PATTERN.test(receiverIban)) {
        throw new UaBankPayValidationError(
            'receiverIban',
            'Receiver IBAN is not a valid Ukrainian IBAN (should be `UA` followed by 27 digits)'
        );
    }
}

function validateAmount(amount: string | undefined): string {
    const value = (amount ?? '').trim();

    if (value === '') {
        // Empty amount means the payer enters it themselves when confirming the payment
        return '';
    }

    const match = AMOUNT_PATTERN.exec(value.toUpperCase());

    if (!match) {
        throw new UaBankPayValidationError(
            'amount',
            'Amount must be a positive number with up to two decimal places, optionally prefixed ' +
            'with the ISO 4217 currency code `UAH` (e.g. `UAH123.45`)'
        );
    }

    if (parseFloat(match[3] ? `${match[2]}.${match[3]}` : match[2]) <= 0) {
        throw new UaBankPayValidationError('amount', 'Amount must be greater than zero');
    }

    return `UAH${match[2]}${match[3] ? `.${match[3]}` : ''}`;
}

function validateReceiverCode(receiverCode: string | number | undefined): string {
    if (receiverCode === undefined || receiverCode === null || receiverCode === '') {
        throw new UaBankPayValidationError('receiverCode', 'Receiver code is required');
    }

    if (typeof receiverCode === 'number' && !Number.isInteger(receiverCode)) {
        throw new UaBankPayValidationError('receiverCode', 'Receiver code must be an integer');
    }

    const value = String(receiverCode);

    if (!RECEIVER_CODE_PATTERN.test(value)) {
        throw new UaBankPayValidationError(
            'receiverCode',
            `Receiver code must be an 8-digit EDRPOU or 10-digit RNOKPP (up to ${MAX_RECEIVER_CODE_LENGTH} digits)`
        );
    }

    return value;
}

function validateOptionalField(name: 'destination' | 'display' | 'reference', value: string | undefined, maxLength: number): string {
    if (value !== undefined && value.length > maxLength) {
        throw new UaBankPayValidationError(
            name,
            `Payment ${name} exceeds maximum length of ${maxLength} characters`
        );
    }

    return value ?? '';
}

function buildPaymentData(request: UaBankPayLinkRequest): string {
    const receiverName = request.receiverName;
    const receiverIban = request.receiverIban;

    validateReceiverName(receiverName);
    validateReceiverIban(receiverIban);

    const amount = validateAmount(request.amount);
    const receiverCode = validateReceiverCode(request.receiverCode);
    const reference = validateOptionalField('reference', request.reference, MAX_REFERENCE_LENGTH);
    const destination = validateOptionalField('destination', request.destination, MAX_DESTINATION_LENGTH);
    const display = validateOptionalField('display', request.display, MAX_DISPLAY_LENGTH);
    const changeable = request.changeable ?? true;

    return [
        'BCD', // Service tag
        NBU_QR_SPEC_VERSION, // Specification version (003)
        '1', // Character set (1 - UTF-8, 2 - Windows-1251)
        'XCT', // Transaction type (XCT - instant OR credit transfer)
        '', // Unique recipient BIC identifier (optional, unused)
        receiverName, // Recipient name
        receiverIban, // Recipient IBAN
        amount, // Payment amount
        receiverCode, // Recipient code (EDRPOU / RNOKPP)
        DEFAULT_CATEGORY, // Category / purpose (ExternalCategoryPurpose1Code ISO 20022)
        reference, // Payment reference (optional)
        destination, // Payment destination (optional)
        display, // Additional data for display (optional)
        (changeable ? '' : LOCK_ALL_FIELDS_MASK), // Field lock mask (FEFF - lock all fields)
        '', // Bill validity date / time (optional, unused)
        '', // Bill creation date / time (optional, unused)
        '' // Electronic data signature (reserved for future use)
    ].join('\n');
}

/**
 * Generates a reusable payment link based on the provided request.
 * The generated link is formatted according to the NBU QR code specification version 3
 * and can be rendered as a QR code or opened directly.
 *
 * @param {UaBankPayLinkRequest} request - An object containing the necessary information to generate the payment link.
 * @returns {string} A URL string that can be used to initiate a payment through the NBU QR code system.
 * @throws {UaBankPayValidationError} Throws a validation error if any of the request fields are missing or invalid.
 * The thrown error has a `field` property identifying the offending request field.
 * @example
 * const payLink = generatePayLink({
 *   receiverName: 'ГО "Верховний Порядок"',
 *   receiverIban: 'UA743077700000026001611157323',
 *   receiverCode: 43723254,
 *   amount: 'UAH123.45',
 *   destination: 'Добровільний внесок на здійснення статутної діяльності ГО "Верховний Порядок"',
 *   reference: 'AAABBBCCCDDDEEEFFF1234',
 *   display: 'Підтримайте нашу організацію!',
 *   changeable: false
 * });
 * console.log(payLink); // Outputs the generated payment link URL
 * @see https://bank.gov.ua/ua/payments/use-qr for the NBU QR code format specification.
 * @remarks The generated payment link is reusable and can be shared with multiple users. However, it is important to
 * verify the payment details in the bank account for received payments to ensure that the correct amount was paid
 * and that the correct details were provided, regardless of the value of the `changeable` flag.
 */
export function generatePayLink(request: UaBankPayLinkRequest): string {
    const paymentData: string = buildPaymentData(request);

    // Encode the payment data string into a Uint8Array and then convert it to a Base64 URL-safe string
    const encoder = new TextEncoder();
    const structureBytes: Uint8Array = encoder.encode(paymentData);
    const base64Url: string = encodeBase64Url(structureBytes);

    return `${NBU_QR_BASE_URL}${base64Url}`;
}

/**
 * UaBankPayProvider generates payment links for the National Bank of Ukraine (NBU) QR code format.
 *
 * @deprecated Use the standalone {@link generatePayLink} function instead.
 * This class is kept only for backwards compatibility and will be removed in a future release.
 */
export class UaBankPayProvider {
    /**
     * Generates a reusable payment link based on the provided UaBankPayLinkRequest.
     *
     * @deprecated Use the standalone {@link generatePayLink} function instead.
     */
    public static generatePayLink(request: UaBankPayLinkRequest): string {
        return generatePayLink(request);
    }
}
