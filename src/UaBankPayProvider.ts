import { UaBankPayLinkRequest } from './UaBankPayLinkRequest';

/**
 * UaBankPayProvider is a class that generates payment links for the National Bank of Ukraine (NBU) QR code format.
 */
export default class UaBankPayProvider {
    /**
     * Generates a reusable payment link based on the provided UaBankPayLinkRequest.
     * The generated link is formatted according to the NBU QR code specifications.
     * @param request An object containing the necessary information to generate the payment link
     */
    public static generatePayLink(request: UaBankPayLinkRequest): string {
        // NBU QR code format specification: https://bank.gov.ua/qr/
        const baseUrl = 'https://bank.gov.ua/qr/';

        // Validate that all required fields are present in the request
        if (!request.receiverName || !request.receiverIban || !request.receiverCode) {
            throw new Error('Missing required fields in UaBankPayLinkRequest');
        }

        // Validate the length of the receiver name and the format of the IBAN
        if (request.receiverName.length > 38) {
            throw new Error('Receiver name exceeds maximum length of 38 characters');
        }
        if (request.receiverIban.length !== 29) {
            throw new Error('Receiver IBAN is not in the correct format (should be 29 characters)');
        }

        // Construct the payment data string according to the NBU QR code format
        const payStructureString: string = 'BCD\n003\n1\nXCT\n'
            + '\n' // Унікальний ідентифікатор отримувача
            + `${request.receiverName}\n`
            + `${request.receiverIban}\n`
            + `${request.amount}\n`
            + `${request.receiverCode}\n`
            + 'SUPP/SUPP\n' // Категорія / ціль (ExternalCategoryPurpose1Code ISO 20022)
            + `${request.reference}\n`
            + `${request.destination}\n`
            + `${request.display}\n`
            + (request.changeable ? '\n' : 'FEFF\n') // Код заборони зміни полів
            + '\n' // Дата / час дії рахунку на оплату
            + '\n' // Дата / час формування рахунку на оплату
            // noinspection BadExpressionStatementJS
            '\n'; // Електронний підпис даних

        // Encode the payment data string into a Uint8Array and then convert it to a Base64 URL-safe string
        const encoder = new TextEncoder();
        const structureBytes: Uint8Array = encoder.encode(payStructureString);
        const base64Url: string = Buffer.from(structureBytes).toString('base64url');

        // Construct the final payment link by appending the Base64-encoded data to the base URL
        return `${baseUrl}${base64Url}`;
    }
}
