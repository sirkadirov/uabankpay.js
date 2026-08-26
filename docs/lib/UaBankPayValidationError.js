/**
 * Error thrown when a payment link request fails validation. The `field`
 * property identifies which field of the request was rejected.
 */
export class UaBankPayValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.name = 'UaBankPayValidationError';
        this.field = field;
    }
}
//# sourceMappingURL=UaBankPayValidationError.js.map