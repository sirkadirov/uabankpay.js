import UaBankPayLinkRequest from './UaBankPayLinkRequest';
// @ts-ignore
import unicodeToWin1251 from 'utf8-to-win1251';

// noinspection JSUnusedGlobalSymbols
export default class UaBankPayProvider {
    public static generatePayLink(request: UaBankPayLinkRequest): string {
        // NBU QR code format specification: https://bank.gov.ua/qr/
        const baseUrl = 'https://bank.gov.ua/qr/';

        // Construct the payment data string according to the NBU QR code format
        const payStructureString: string = [
            'BCD',
            '002',
            '2',
            'UCT',
            '', // reserved
            request.receiverName,
            request.receiverIban,
            request.amount,
            request.receiverCode,
            '', // reserved
            '', // reserved
            request.destination,
            '' // reserved
        ].join('\n');

        // Encode the payment data string in Windows-1251 encoding as required by the NBU QR code specification
        const win1251EncodedData: Uint8Array<ArrayBufferLike> = unicodeToWin1251(payStructureString);

        // Convert the encoded data to a Base64 string
        const base64EncodedData: string = btoa(String.fromCharCode(...win1251EncodedData));

        // Construct the final payment link by appending the Base64-encoded data to the base URL
        return `${baseUrl}${base64EncodedData}`;
    }
}
