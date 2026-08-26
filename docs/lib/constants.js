/**
 * Base URL of the NBU QR service. A payment link is this URL followed by the
 * base64url-encoded payment data structure.
 */
export const NBU_QR_BASE_URL = 'https://bank.gov.ua/qr/';
/**
 * NBU QR specification version implemented by this library (version 3).
 */
export const NBU_QR_SPEC_VERSION = '003';
/**
 * Category / purpose code written into the payment data structure
 * (`SUPP/SUPP` - ExternalCategoryPurpose1Code ISO 20022).
 */
export const DEFAULT_CATEGORY = 'SUPP/SUPP';
/**
 * Field lock mask that prohibits the payer from changing any field of the payment.
 */
export const LOCK_ALL_FIELDS_MASK = 'FEFF';
/** Maximum length of the receiver name. */
export const MAX_RECEIVER_NAME_LENGTH = 140;
/** Maximum length of the receiver code (EDRPOU or RNOKPP). */
export const MAX_RECEIVER_CODE_LENGTH = 10;
/** Maximum length of the payment reference. */
export const MAX_REFERENCE_LENGTH = 35;
/** Maximum length of the payment destination (purpose). */
export const MAX_DESTINATION_LENGTH = 420;
/** Maximum length of the additional display information. */
export const MAX_DISPLAY_LENGTH = 140;
//# sourceMappingURL=constants.js.map