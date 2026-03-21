import { describe, expect, test } from '@jest/globals';
import { UaBankPayLinkRequest } from './UaBankPayLinkRequest';
import UaBankPayProvider from './UaBankPayProvider';

describe('Verify NBU QR links', () => {
    test('All functions of NBU QR + non-changeable', () => {
        const request: UaBankPayLinkRequest = {
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: 'UAH123.45',
            receiverCode: 43723254,
            destination: 'Добровільний внесок 12345',
            reference: 'AAABBBCCCDDDEEEFFF1234',
            display: 'Добровільний внесок',
            changeable: false
        };
        const actualLink: string = UaBankPayProvider.generatePayLink(request);

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwpVQUgxMjMuNDUKNDM3MjMyNTQKU1VQUC9TVVBQCkFBQUJCQkNDQ0REREVFRUZGRjEyMzQK0JTQvtCx0YDQvtCy0ZbQu9GM0L3QuNC5INCy0L3QtdGB0L7QuiAxMjM0NQrQlNC-0LHRgNC-0LLRltC70YzQvdC40Lkg0LLQvdC10YHQvtC6CkZFRkYKCgo';
        expect(actualLink).toBe(desiredLink);
    });

    test('All functions of NBU QR + changeable', () => {
        const request: UaBankPayLinkRequest = {
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: 'UAH123.45',
            receiverCode: 43723254,
            destination: 'Добровільний внесок 12345',
            reference: 'AAABBBCCCDDDEEEFFF1234',
            display: 'Добровільний внесок',
            changeable: true
        };
        const actualLink: string = UaBankPayProvider.generatePayLink(request);

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwpVQUgxMjMuNDUKNDM3MjMyNTQKU1VQUC9TVVBQCkFBQUJCQkNDQ0REREVFRUZGRjEyMzQK0JTQvtCx0YDQvtCy0ZbQu9GM0L3QuNC5INCy0L3QtdGB0L7QuiAxMjM0NQrQlNC-0LHRgNC-0LLRltC70YzQvdC40Lkg0LLQvdC10YHQvtC6CgoKCg';
        expect(actualLink).toBe(desiredLink);
    });

    test('Test minimal functions of NBU QR', () => {
        const request: UaBankPayLinkRequest = {
            receiverName: 'ГО "Верховний Порядок"',
            receiverIban: 'UA743077700000026001611157323',
            amount: '',
            receiverCode: 43723254,
            destination: '',
            reference: '',
            display: '',
            changeable: true
        };
        const actualLink: string = UaBankPayProvider.generatePayLink(request);

        const desiredLink: string = 'https://bank.gov.ua/qr/QkNECjAwMwoxClhDVAoK0JPQniAi0JLQtdGA0YXQvtCy0L3QuNC5INCf0L7RgNGP0LTQvtC6IgpVQTc0MzA3NzcwMDAwMDAyNjAwMTYxMTE1NzMyMwoKNDM3MjMyNTQKU1VQUC9TVVBQCgoKCgoKCg';
        expect(actualLink).toBe(desiredLink);
    });
});
