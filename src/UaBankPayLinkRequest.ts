export type UaBankPayLinkRequest = {
    /**
     * The name of the person or entity receiving the payment. This is typically the name of the payee or beneficiary.
     * It is important to provide the correct receiver name to ensure that the payment is directed to the intended recipient.
     * @type {string}
     * @example Громадська організація "Верховний Порядок"
     */
    receiverName: string;

    /**
     * The International Bank Account Number (IBAN) of the receiver. The IBAN is a standardized format for bank account
     * numbers that is used internationally to facilitate cross-border transactions. It includes a country code, check
     * digits, and the bank account number. Providing the correct IBAN is crucial for ensuring that the payment is
     * processed correctly and reaches the intended recipient.
     * @type {string} Ukrainian IBAN: `UA` followed by 27 digits (29 characters in total).
     * @example UA123456789012345678901234567890
     */
    receiverIban: string;

    /**
     * The amount of money to be paid, prefixed with the ISO 4217 currency code. The value must be a non-negative
     * number with up to two decimal places (e.g., hryvnias and kopiykas). Pass an empty string to let the payer
     * enter the amount themselves when confirming the payment.
     * @type {string}
     * @example UAH123.45
     */
    amount: string;

    /**
     * The code representing the receiver's state identification number (EDRPOU or RNOKPP). This is a numeric code
     * that identifies the legal entity or individual entrepreneur in Ukraine. It is used for tax and legal purposes
     * and is required for processing payments to ensure that the funds are directed to the correct recipient.
     * Prefer passing a string to preserve leading zeros.
     * @type {number | string} 8-digit EDRPOU or 10-digit RNOKPP.
     * @example 43723254
     */
    receiverCode: number | string;

    /**
     * A description of the payment, providing details about the purpose of the transaction. This information can be
     * useful for both the payer and the receiver to understand the context of the payment. It may include information
     * such as the reason for the payment, the invoice number, or any other relevant details that can help identify
     * the transaction. Providing a clear and concise description can help avoid confusion and ensure that the payment
     * is properly documented and taken into account for accounting and record-keeping purposes.
     * Optional, defaults to an empty string. Must not exceed 420 characters.
     * @type {string}
     * @example Добровільний внесок на здійснення статутної діяльності ГО "Верховний Порядок"
     */
    destination?: string;

    /**
     * Reference information for the payment, which can be used to provide additional context or details about the transaction.
     * This field is optional and can be left empty if not needed. It may include information such as a reference number,
     * a note for the recipient, or any other relevant details that can help identify the payment or provide additional
     * context for the transaction. Providing reference information can be helpful for both the payer and the receiver
     * to keep track of payments and ensure that they are properly documented.
     * Optional, defaults to an empty string. Must not exceed 35 characters.
     * @type {string}
     * @example AAABBBCCCDDDEEEFFF1234
     */
    reference?: string;

    /**
     * Optional field for display information. This can be used to specify how the payment information should be displayed
     * to the user. It may include instructions for the payer, additional details about the payment, or any other relevant
     * information that can help guide the user through the payment process. This field is optional and can be left empty
     * if not needed.
     * Optional, defaults to an empty string. Must not exceed 140 characters.
     * @type {string}
     * @example Внесок на підтримку діяльності
     */
    display?: string;

    /**
     * A boolean flag indicating whether the fields in the payment request can be changed by the user. If set to true, the
     * user may be allowed to modify certain fields in the payment request before finalizing the transaction. If set to
     * false, the fields in the payment request are fixed and cannot be changed by the user. This can be useful for ensuring
     * that the payment information is accurate and consistent with the intended transaction, while still allowing for some
     * flexibility if needed. Note that not all banks or payment providers may support this feature, so it is important to
     * check the bank account for received payments to confirm whether the user paid the correct amount and provided the
     * correct details, regardless of the value of the flag.
     * Optional, defaults to `true`.
     */
    changeable?: boolean;
}
