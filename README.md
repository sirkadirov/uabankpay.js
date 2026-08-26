# UABankPay.js
[![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/sirkadirov/uabankpay.js)](https://github.com/sirkadirov/uabankpay.js/issues)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/sirkadirov/uabankpay.js/testing.yml)
[![NPM Version](https://img.shields.io/npm/v/%40sirkadirov%2Fuabankpay)](https://www.npmjs.com/package/@sirkadirov/uabankpay)
[![JSR](https://jsr.io/badges/@sirkadirov/uabankpay)](https://jsr.io/@sirkadirov/uabankpay)
[![NPM Downloads](https://img.shields.io/npm/dy/%40sirkadirov%2Fuabankpay)](https://www.npmjs.com/package/@sirkadirov/uabankpay)

**UABankPay** is a library for integrating Ukrainian direct (IBAN to IBAN) payments into your applications. It provides a
simple and efficient way to generate payment links and handle other related stuff in the future.

> **Note:** library uses NBU QR version 3 specification, which is the latest version as of the moment of writing this README
(August 2026). If you are looking for a library that implements the older version of the specification, please check out
other projects or contribute to this one by adding support for the older version.

<kbd> <br> [Try out interactive demo](https://sirkadirov.github.io/uabankpay.js/) <br> </kbd>

## Legal basis
The library is based on the [NBU QR](https://bank.gov.ua/ua/payments/use-qr) specification, which defines the
format and requirements for generating payment links for direct payments in Ukraine. This specification ensures
that the generated payment links are compliant with the standards set by the National Bank of Ukraine.

> See full specification at https://zakon.rada.gov.ua/laws/show/v0097500-25

The library is designed to be flexible and easy to use, implementing most common features of the NBU QR
specification. Some features may not be implemented yet, but feel free to contribute or request features
(and donating to any Ukrainian charity you want) if you need something specific.

## Usage
To use this library with [Node](https://nodejs.org/), you need to install it first. You can do this using `npm`:

```powershell
npm install @sirkadirov/uabankpay
```

Also, if you prefer using [JSR](https://jsr.io/), you can install it using the following command (with `npx`):

```powerShell
npx jsr add @sirkadirov/uabankpay
```
For [Deno](https://deno.com/) users, you can add the library using the following command:

```powershell
deno add jsr:@sirkadirov/uabankpay
```

Those, who prefer using [Bun](https://bun.com/), can install the library using the following command:

```powershell
bunx jsr add @sirkadirov/uabankpay
```

Then, you can import the library and use it in your code. The package provides the `generatePayLink` and `parsePayLink`
functions along with the `UaBankPayLinkRequest` type. Here's a quick example of how to import the library
and generate a payment link, if you are writing TypeScript code:

```typescript
import { generatePayLink, type UaBankPayLinkRequest } from '@sirkadirov/uabankpay';

// Form a payment request object with the necessary details.
// Only receiverName, receiverIban, amount and receiverCode are required;
// the rest default to empty values / changeable behavior.
const paymentRequest: UaBankPayLinkRequest = {
    receiverName: 'ГО "Верховний Порядок"',
    receiverIban: 'UA743077700000026001611157323',
    amount: 'UAH123.45',
    receiverCode: 43723254,
    destination: 'Добровільний внесок 12345',
    reference: 'AAABBBCCCDDDEEEFFF1234',
    display: 'Добровільний внесок',
    changeable: false
};

// Generate the payment link using the NBU QR specification
const paymentLink: string = generatePayLink(paymentRequest);
console.log(paymentLink); // This link can be used directly or used in QR code generation
```

You can also decode an existing payment link back into a payment request object:

```typescript
import { parsePayLink } from '@sirkadirov/uabankpay';

const request = parsePayLink('https://bank.gov.ua/qr/QkNECjAwMwo...');
console.log(request.receiverIban); // UA743077700000026001611157323
```

> **Note:** the library runs anywhere `btoa`/`atob` are available - browsers, Deno, Bun, web workers and
> Node.js 16+ - and does not require any polyfills.

## API reference

### `generatePayLink(request: UaBankPayLinkRequest): string`

Generates an NBU QR payment link from the given payment request.

### `parsePayLink(url: string): UaBankPayLinkRequest`

Parses a payment link generated according to the NBU QR specification back into a payment request object.
Passing the parsed object back to `generatePayLink` reproduces the original link.

### `UaBankPayValidationError extends Error`

Thrown by both functions when input is invalid. Its `field` property identifies the offending request field
(or `'url'` when parsing fails), so consumers can catch and handle errors precisely:

```typescript
import { generatePayLink, UaBankPayValidationError } from '@sirkadirov/uabankpay';

try {
    generatePayLink({ /* ... */ });
} catch (error) {
    if (error instanceof UaBankPayValidationError) {
        console.error(`Invalid field: ${error.field}`); // e.g. "Invalid field: receiverIban"
    }
}
```

### Payment request fields

| Field | Type | Required | Constraints |
|---|---|---|---|
| `receiverName` | `string` | yes | Non-empty, up to 140 characters |
| `receiverIban` | `string` | yes | Ukrainian IBAN: `UA` followed by 27 digits |
| `amount` | `string` | yes | `UAH` prefix optional, positive number, up to two decimal places (`UAH123.45`, `123.45`, or empty string to let the payer choose) |
| `receiverCode` | `string \| number` | yes | 8-digit EDRPOU or 10-digit RNOKPP; prefer strings to preserve leading zeros |
| `destination` | `string` | no | Up to 420 characters |
| `reference` | `string` | no | Up to 35 characters |
| `display` | `string` | no | Up to 140 characters |
| `changeable` | `boolean` | no | Whether the payer may edit fields before confirming (default `true`) |

All limits follow the NBU QR version 3 specification (Постанова НБУ №97). Validation errors carry the failed
field name in `error.field`.

> `UaBankPayProvider.generatePayLink()` remains available as a deprecated alias for `generatePayLink()`
> and will be removed in a future major release.

## Supported banks
The library was tested with the following banks, but it should work with any Ukrainian bank that supports the NBU QR
specification (see [https://bank.gov.ua/ua/qr](https://bank.gov.ua/ua/qr) for the full list of supported banks):

| Bank                  | Last tested by               | Compliance | Notes |
|-----------------------|------------------------------|------------|-------|
| Accordbank            | 2026-08-26 by @sirkadirov    | Full       |       |
| abank                 | 2026-08-26 by @sirkadirov    | Full       |       |
| alliance bank         | 2026-08-26 by @sirkadirov    | Full       |       |
| BVR (Власний Рахунок) | 2026-08-26 by @sirkadirov    | Full       |       |
| CA+ (Credit Agricole) | 2026-08-26 by @i_klmts       | Full       |       |
| FUIB (ПУМБ)           | 2026-08-26 by @sirkadirov    | Full       |       |
| KredoBank             | 2026-08-26 by @sirkadirov    | Full       |       |
| monobank              | 2026-08-26 by @sirkadirov    | Full       |       |
| NovaPay               | 2026-08-26 by @sirkadirov    | Full       |       |
| OTP Bank              | 2026-08-26 by @i_klmts       | Full       |       |
| Pivdennyi             | 2026-08-26 by @sirkadirov    | Partial    | Always shows as noninstant payment |
| PrivatBank            | 2026-08-26 by @sirkadirov    | Full       |       |
| Procredit Bank        | 2026-08-26 by @i_klmts       | Partial    | Always allows editing |
| Sense bank            | 2026-08-26 by @sirkadirov    | Full       |       |
| Ukrgasbank            | 2026-08-26 by @i_klmts       | Error      | `QR code is invalid` error |
| VST Bank              | 2026-08-26 by @i_klmts       | Full       |       |
| Winbank (Piraeus)     | 2026-08-26 by @sirkadirov    | Full       |       |

> If you encounter any issues with a specific bank or if you want to update support status for a bank that is not
> listed here, please open an issue or submit a pull request with such changes.

## Development

### Building the library

To build the library, you can use the following command in your command line:

```bash
npm run build
```

This will compile the TypeScript code into JavaScript and create the necessary files in the `dist` directory.

### Testing the library
To run the tests for the library, you can use the following command:

```bash
npm test
```

## Contributing
If you want to contribute to the development of UABankPay, feel free to fork the repository and submit a pull request.
We welcome any contributions that can help improve the library.

## Contact author
If you have any questions, suggestions, or issues regarding UABankPay, please feel free to contact us. You can open an
issue in the GitHub repository or reach out to us via email at [contact@sirkadirov.com](mailto:contact@sirkadirov.com).

## License
UABankPay is licensed under the MIT license. You can find the full license text in the LICENSE file in the repository.
This library is provided "as is", without any warranties or conditions of any kind, either express or implied. We are
not liable for any damages arising out of or in connection with the use of this library.
