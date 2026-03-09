# UABankPay.js
[![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/sirkadirov/uabankpay.js)](https://github.com/sirkadirov/uabankpay.js/issues)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/sirkadirov/uabankpay.js/testing.yml)
[![NPM Version](https://img.shields.io/npm/v/%40sirkadirov%2Fuabankpay)](https://www.npmjs.com/package/@sirkadirov/uabankpay)
[![JSR](https://jsr.io/badges/@sirkadirov/uabankpay)](https://jsr.io/@sirkadirov/uabankpay)
[![NPM Downloads](https://img.shields.io/npm/dy/%40sirkadirov%2Fuabankpay)](https://www.npmjs.com/package/@sirkadirov/uabankpay)

**UABankPay** is a library for integrating Ukrainian direct (IBAN to IBAN) payments into your applications. It provides a
simple and efficient way to generate payment links and handle other related stuff in the future.

> **Note:** library uses NBU QR version 3 specification, which is the latest version as of the moment of writing this README
(March 2026). If you are looking for a library that implements the older version of the specification, please check out
other projects or contribute to this one by adding support for the older version.

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

Then, you can import the library and use it in your code. Here's a quick example of how to import the library
and generate a payment link, if you are writing TypeScript code:

```typescript
import uabankpay, { type UaBankPayLinkRequest } from '@sirkadirov/uabankpay';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique transaction ID for this payment request
const transactionId: string = uuidv4();

// Form a payment request object with the necessary details
const paymentRequest: UaBankPayLinkRequest = {
    receiverName: 'ГО "Верховний Порядок"',
    receiverIban: 'UA743077700000026001611157323',
    amount: 'UAH123.45',
    receiverCode: 43723254,
    destination: 'Добровільний внесок 12345',
    reference: transactionId,
    display: 'Добровільний внесок',
    changeable: false
};

// Generate the payment link using the NBU QR specification
const paymentLink: string = UaBankPayProvider.generatePayLink(paymentRequest);
console.log(paymentLink); // This link can be used directly or used in QR code generation
```

> Note that the library uses `Buffer` for encoding the payment request data, which is a built-in class in `Node.js`.
> If you are using this library in a browser environment, make sure to include a polyfill for Buffer, such as
> [`buffer`](https://www.npmjs.com/package/buffer), so that the library can function properly in the browser.

## Supported banks
The library was tested with the following banks, but it should work with any Ukrainian bank that supports the NBU QR
specification (see [https://bank.gov.ua/ua/qr](https://bank.gov.ua/ua/qr) for the full list of supported banks):
- Monobank
- Abank
- Pivdenny Bank
- KredoBank
- PrivatBank
- Vlasny Rakhunok
- Raiffeisen Bank
- NovaPay

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
