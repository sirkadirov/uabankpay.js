import { describe, expect, test } from '@jest/globals';
import { UaBankPayLinkRequest } from './UaBankPayLinkRequest.js';
import { UaBankPayProvider, generatePayLink } from './UaBankPayProvider.js';
import { parsePayLink } from './UaBankPayParser.js';
import { UaBankPayValidationError } from './UaBankPayValidationError.js';

const VALID_REQUEST: UaBankPayLinkRequest = {
    receiverName: 'ГО "Верховний Порядок"',
    receiverIban: 'UA743077700000026001611157323',
    amount: 'UAH123.45',
    receiverCode: 43723254,
    destination: 'Добровільний внесок 12345',
    reference: 'AAABBBCCCDDDEEEFFF1234',
    display: 'Добровільний внесок',
    changeable: false
};

describe('Verify NBU QR links', () => {
    test('All functions of NBU QR + non-changeable', () => {
        const actualLink: string = generatePayLink(VALID_REQUEST);

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwpVQUgxMjMuNDUKNDM3MjMyNTQKU1VQUC9TVVBQCkFBQUJCQkNDQ0REREVFRUZGRjEyMzQK0JTQvtCx0YDQvtCy0ZbQu9GM0L3QuNC5INCy0L3QtdGB0L7QuiAxMjM0NQrQlNC-0LHRgNC-0LLRltC70YzQvdC40Lkg0LLQvdC10YHQvtC6CkZFRkYKCgo';
        expect(actualLink).toBe(desiredLink);
    });

    test('All functions of NBU QR + changeable', () => {
        const actualLink: string = generatePayLink({
            ...VALID_REQUEST,
            changeable: true
        });

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwpVQUgxMjMuNDUKNDM3MjMyNTQKU1VQUC9TVVBQCkFBQUJCQkNDQ0REREVFRUZGRjEyMzQK0JTQvtCx0YDQvtCy0ZbQu9GM0L3QuNC5INCy0L3QtdGB0L7QuiAxMjM0NQrQlNC-0LHRgNC-0LLRltC70YzQvdC40Lkg0LLQvdC10YHQvtC6CgoKCg';
        expect(actualLink).toBe(desiredLink);
    });

    test('Test minimal functions of NBU QR', () => {
        const actualLink: string = generatePayLink({
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: '',
            receiverCode: 43723254,
            destination: '',
            reference: '',
            display: '',
            changeable: true
        });

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwoKNDM3MjMyNTQKU1VQUC9TVVBQCgoKCgoKCg';
        expect(actualLink).toBe(desiredLink);
    });
});

describe('Optional fields', () => {
    test('Omitted optional fields produce the same link as empty strings', () => {
        const omittedLink: string = generatePayLink({
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: '',
            receiverCode: 43723254
        });

        const explicitLink: string = generatePayLink({
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: '',
            receiverCode: 43723254,
            destination: '',
            reference: '',
            display: '',
            changeable: true
        });

        expect(omittedLink).toBe(explicitLink);
    });

    test('Amount without a currency prefix is normalized to UAH', () => {
        const withCurrency: string = generatePayLink({ ...VALID_REQUEST, amount: 'UAH99.50' });
        const withoutCurrency: string = generatePayLink({ ...VALID_REQUEST, amount: '99.50' });

        expect(withoutCurrency).toBe(withCurrency);
        expect(parsePayLink(generatePayLink({ ...VALID_REQUEST, amount: '99.5' })).amount).toBe('UAH99.5');
    });
});

describe('Validation errors', () => {
    function expectFieldError(request: Partial<UaBankPayLinkRequest>, field: string): void {
        try {
            generatePayLink({ ...VALID_REQUEST, ...request } as UaBankPayLinkRequest);
            throw new Error(`Expected validation to fail for field "${field}"`);
        } catch (error) {
            expect(error).toBeInstanceOf(UaBankPayValidationError);
            expect((error as UaBankPayValidationError).field).toBe(field);
        }
    }

    test('Rejects missing receiver name', () => {
        expectFieldError({ receiverName: '' }, 'receiverName');
    });

    test('Rejects too long receiver name', () => {
        expectFieldError({ receiverName: 'Г'.repeat(141) }, 'receiverName');
    });

    test('Accepts receiver name up to 140 characters per spec v3', () => {
        expect(() => generatePayLink({ ...VALID_REQUEST, receiverName: 'Г'.repeat(140) })).not.toThrow();
    });

    test('Rejects malformed IBAN format', () => {
        expectFieldError({ receiverIban: 'XX743077700000026001611157323' }, 'receiverIban');
    });

    test('Rejects IBAN with invalid length', () => {
        expectFieldError({ receiverIban: 'UA74307770000002600161115732' }, 'receiverIban');
    });

    test('Rejects IBAN containing non-digits after country code', () => {
        expectFieldError({ receiverIban: 'UA74307770000002600161115ABC3'.replace('74307770000002600161115ABC3', '74307770000002600161115732A') }, 'receiverIban');
    });

    test('Rejects malformed amounts', () => {
        for (const amount of ['abc', 'UAH12,3', '12.345', '-5', 'UAH', '1..2']) {
            expectFieldError({ amount }, 'amount');
        }
    });

    test('Rejects zero amount', () => {
        for (const amount of ['UAH0', '0.00']) {
            expectFieldError({ amount }, 'amount');
        }
    });

    test('Rejects non-integer receiver code', () => {
        expectFieldError({ receiverCode: 43723254.5 }, 'receiverCode');
    });

    test('Rejects receiver code with invalid digit count', () => {
        for (const receiverCode of [1234567, '123456789', 0]) {
            expectFieldError({ receiverCode }, 'receiverCode');
        }
    });

    test('Accepts 8-digit EDRPOU and 10-digit RNOKPP codes', () => {
        expect(() => generatePayLink({ ...VALID_REQUEST, receiverCode: '43723254' })).not.toThrow();
        expect(() => generatePayLink({ ...VALID_REQUEST, receiverCode: '1234567890' })).not.toThrow();
    });

    test('Preserves leading zeros in string receiver codes', () => {
        const link: string = generatePayLink({ ...VALID_REQUEST, receiverCode: '00123456' });
        const parsed = parsePayLink(link);

        expect(parsed.receiverCode).toBe('00123456');
    });

    test('Rejects too long destination', () => {
        expectFieldError({ destination: 'а'.repeat(421) }, 'destination');
    });

    test('Accepts destination up to 420 characters per spec v3', () => {
        expect(() => generatePayLink({ ...VALID_REQUEST, destination: 'а'.repeat(420) })).not.toThrow();
    });

    test('Rejects too long reference', () => {
        expectFieldError({ reference: 'A'.repeat(36) }, 'reference');
    });

    test('Rejects too long display text', () => {
        expectFieldError({ display: 'В'.repeat(141) }, 'display');
    });
});

describe('parsePayLink', () => {
    test('Round-trips a full payment link', () => {
        const link: string = generatePayLink(VALID_REQUEST);
        const parsed = parsePayLink(link);

        expect(parsed).toEqual({
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: 'UAH123.45',
            receiverCode: '43723254',
            destination: 'Добровільний внесок 12345',
            reference: 'AAABBBCCCDDDEEEFFF1234',
            display: 'Добровільний внесок',
            changeable: false
        });
    });

    test('Re-generating a link from a parsed request reproduces the original', () => {
        const link: string = generatePayLink(VALID_REQUEST);

        expect(generatePayLink(parsePayLink(link))).toBe(link);
    });

    test('Detects the changeable flag from the lock mask', () => {
        const changeable = parsePayLink(generatePayLink({ ...VALID_REQUEST, changeable: true }));
        const fixed = parsePayLink(generatePayLink({ ...VALID_REQUEST, changeable: false }));

        expect(changeable.changeable).toBe(true);
        expect(fixed.changeable).toBe(false);
    });

    test('Rejects URLs pointing outside the NBU QR service', () => {
        try {
            parsePayLink('https://example.com/qr/QkNE');
            throw new Error('Expected parsing to fail');
        } catch (error) {
            expect(error).toBeInstanceOf(UaBankPayValidationError);
            expect((error as UaBankPayValidationError).field).toBe('url');
        }
    });

    test('Rejects malformed payloads', () => {
        try {
            parsePayLink('https://bank.gov.ua/qr/not-base64url!!!');
            throw new Error('Expected parsing to fail');
        } catch (error) {
            expect(error).toBeInstanceOf(UaBankPayValidationError);
        }
    });
});

describe('Backwards compatibility', () => {
    test('UaBankPayProvider.generatePayLink delegates to generatePayLink', () => {
        expect(UaBankPayProvider.generatePayLink(VALID_REQUEST)).toBe(generatePayLink(VALID_REQUEST));
    });

    test('Validation errors are catchable Error instances with a field property', () => {
        try {
            generatePayLink({ ...VALID_REQUEST, receiverIban: 'invalid' });
            throw new Error('Expected validation to fail');
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(UaBankPayValidationError);
            expect((error as UaBankPayValidationError).field).toBe('receiverIban');
            expect((error as Error).name).toBe('UaBankPayValidationError');
        }
    });
});
