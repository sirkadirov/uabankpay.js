import { UaBankPayLinkRequest } from './UaBankPayLinkRequest.js';

/**
 * UaBankPayProvider is a class that generates payment links for the National Bank of Ukraine (NBU) QR code format.
 */
export default class UaBankPayProvider {
    /**
     * Generates a reusable payment link based on the provided UaBankPayLinkRequest.
     * The generated link is formatted according to the NBU QR code specifications.
     * @param {UaBankPayLinkRequest} request - An object containing the necessary information to generate the payment link.
     * @returns {string} A URL string that can be used to initiate a payment through the NBU QR code system.
     * @throws {Error} Throws an error if required fields are missing or if the input data does not meet the specified format requirements.
     * @example
     * const payLink = UaBankPayProvider.generatePayLink({
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
     * @see https://bank.gov.ua/qr/ for the NBU QR code format specification.
     * @remarks The generated payment link is reusable and can be shared with multiple users. However, it is important to
     * verify the payment details in the bank account for received payments to ensure that the correct amount was paid
     * and that the correct details were provided, regardless of the value of the changeable flag.
     */
    public static generatePayLink({
        receiverName,
        receiverIban,
        receiverCode,
        amount = 'UAH0.01',
        destination = '',
        reference = '',
        display = '',
        changeable = true
    }: UaBankPayLinkRequest): string {
        // NBU QR code format specification: https://bank.gov.ua/qr/
        const baseUrl = 'https://bank.gov.ua/qr/';

        // Validate that all required fields are present in the request
        if (!receiverName || !receiverIban || !receiverCode) {
            throw new Error('Missing required fields in UaBankPayLinkRequest');
        }

        // Validate the length of the receiver name and the format of the IBAN
        if (receiverName.length > 38) {
            throw new Error('Receiver name exceeds maximum length of 38 characters');
        }
        if (receiverIban.length !== 29) {
            throw new Error('Receiver IBAN is not in the correct format (should be 29 characters)');
        }

        // Construct the payment data string according to the NBU QR code specifications
        const paymentDataSeparator: string = '\n';
        const paymentData: string = [
            'BCD', // Версія формату
            '003', // Версія специфікації
            '1', // Тип кодування (1 - UTF-8, 2 - Windows-1251)
            'XCT', // Тип транзакції (XCT - миттєвий АБО кредитовий переказ)
            '', // Унікальний ідентифікатор отримувача BIC (необов'язковий)
            receiverName, // Ім'я отримувача
            receiverIban, // IBAN отримувача
            amount, // Сума платежу
            receiverCode, // Код отримувача (EDRPOU)
            'SUPP/SUPP', // Категорія / ціль (ExternalCategoryPurpose1Code ISO 20022)
            reference, // Референс для платежу (необов'язковий)
            destination, // Призначення платежу (необов'язковий)
            display, // Додаткові дані для відображення (необов'язковий)
            (changeable ? '' : 'FEFF'), // Код заборони зміни полів (FEFF - заборона зміни всіх полів)
            '', // Дата / час дії рахунку на оплату (необов'язковий)
            '', // Дата / час формування рахунку на оплату (необов'язковий)
            '' // Електронний підпис даних (для майбутнього використання, наразі не використовується)
        ].join(paymentDataSeparator);

        // Encode the payment data string into a Uint8Array and then convert it to a Base64 URL-safe string
        const encoder = new TextEncoder();
        const structureBytes: Uint8Array = encoder.encode(paymentData);
        const base64Url: string = Buffer.from(structureBytes).toString('base64url');

        // Construct the final payment link by appending the Base64-encoded data to the base URL
        return `${baseUrl}${base64Url}`;
    }
}
