/**
 * Error thrown when a payment link request fails validation. The `field`
 * property identifies which field of the request was rejected.
 */
export class UaBankPayValidationError extends Error {
    /** Name of the request field that failed validation, or `'request'` for request-level problems. */
    public readonly field: string;

    constructor(field: string, message: string) {
        super(message);
        this.name = 'UaBankPayValidationError';
        this.field = field;
    }
}
