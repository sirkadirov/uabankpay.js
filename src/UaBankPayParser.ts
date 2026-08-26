import type { UaBankPayLinkRequest } from './UaBankPayLinkRequest.js';
import { UaBankPayValidationError } from './UaBankPayValidationError.js';
import { NBU_QR_BASE_URL } from './constants.js';
import { decodeBase64Url } from './base64url.js';

/**
 * Parses a payment link generated according to the NBU QR specification back
 * into a payment request object. The result of this function can be passed to
 * {@link generatePayLink} to reconstruct an equivalent payment link.
 *
 * @param {string} url - A payment link produced by {@link generatePayLink} or another NBU QR generator.
 * @returns {UaBankPayLinkRequest} The parsed payment request.
 * @throws {UaBankPayValidationError} Throws a validation error if the URL is malformed,
 * does not point to the NBU QR service or contains an unexpected data structure.
 * @example
 * const request = parsePayLink('https://bank.gov.ua/qr/QkNECjAwMwox...');
 * console.log(request.receiverIban);
 */
export function parsePayLink(url: string): UaBankPayLinkRequest {
    if (!url.startsWith(NBU_QR_BASE_URL)) {
        throw new UaBankPayValidationError(
            'url',
            `Платіжне посилання має починатися з ${NBU_QR_BASE_URL}`
        );
    }

    let decoded: string;

    try {
        const encodedPayload = url.slice(NBU_QR_BASE_URL.length);
        const payloadBytes = decodeBase64Url(encodedPayload);
        decoded = new TextDecoder().decode(payloadBytes);
    } catch {
        throw new UaBankPayValidationError(
            'url',
            'Навантаження платіжного посилання не є дійсними даними base64url'
        );
    }

    const fields = decoded.split('\n');

    if (fields.length !== 17 || fields[0] !== 'BCD') {
        throw new UaBankPayValidationError(
            'url',
            'Навантаження платіжного посилання не містить дійсної структури даних NBU QR'
        );
    }

    const [
        ,
        specVersion,
        characterSet,
        ,
        ,
        receiverName,
        receiverIban,
        amount,
        receiverCode,
        ,
        reference,
        destination,
        display,
        lockMask
    ] = fields;

    if (specVersion !== '003') {
        throw new UaBankPayValidationError(
            'url',
            `Непідтримувана версія специфікації NBU QR: ${specVersion}. Підтримується лише версія 003`
        );
    }

    if (characterSet !== '1') {
        throw new UaBankPayValidationError(
            'url',
            `Непідтримуване кодування даних: ${characterSet}. Підтримується лише UTF-8 (1)`
        );
    }

    return {
        receiverName,
        receiverIban,
        amount,
        receiverCode,
        destination,
        reference,
        display,
        changeable: lockMask === ''
    };
}
