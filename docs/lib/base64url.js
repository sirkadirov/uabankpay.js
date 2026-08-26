/**
 * Base64url (RFC 4648 §5) helpers implemented on top of `btoa`/`atob`,
 * which are available in browsers, Deno, Bun, web workers and Node.js 16+.
 * This keeps the library free of any Node-specific `Buffer` dependency.
 */
const CHUNK_SIZE = 0x8000;
export function encodeBase64Url(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE));
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
export function decodeBase64Url(encoded) {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = padded.length % 4;
    const base64 = remainder === 0 ? padded : padded + '='.repeat(4 - remainder);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}
//# sourceMappingURL=base64url.js.map