# Simple exchange

Executing P2P trades of assets on the simple exchange contract.

# Summary

This component allows users to execute P2P trades of assets on the simple exchange contract on Agoric network.

# Details

The exchange contract was written with simplicity in mind. It holds the order books which is filled when users make an offer to the contract describing what asset they give and what asset they want. Exchange contract introduces keywords `Asset` and `Price`, where `Asset` - what buyer gives to the exchange counterparty and `Price` - what buyer is willing to get from the exchange counterparty. For seller it will be vice versa - `Asset` - what seller gets and `Price` - what seller gives.

In order to execute the exchange, users have to simply issue offers to the contract with information about what they give and what they want. As soon as user creates an offer that matches one of the existing offers, contract will execute the trade and counterparties will receive their desired assets.

# Dependencies

As this contract was written with simplicity in mind, this contract doesn’t have any dependency other that agoric-sdk itself (which depends on go, node, npm and  yarn, check Agoric SDK getting started [here](https://docs.agoric.com/guides/getting-started/#getting-support)). 

Recommended agoric-sdk installation:

```bash
go version # go version go1.20.6 darwin/arm64
node --version # v18.18.0
npm --version # 9.8.1
yarn --version # 1.22.5

# inside agoric-sdk folder
git checkout agoric-upgrade-11wf
yarn install && yarn build
agoric --version # 0.21.2-u11.0
```

In order to start an instance of the simple exchange contract it does not require any terms, or privateArgs. Only the installation reference and issuer keyword record, which in example described above should be following:

```jsx
const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );
```

# Contract Facets

`creatorFacet` of the contract is empty:

```jsx
const creatorFacet = Far('creatorFacet', {});
```

`publicFacet` of the contract contains two methods:

```jsx
const publicFacet = Far('publicFacet', {
    makeInvitation: makeExchangeInvitation,
    getNotifier: () => notifier,
  });
```

`getNotifier` is a method that returns `NotifierRecord`. It is used to retrieve current order book and get updates when order book state changes.

`makeInvitation` returns an `Invitation` that should be exercised when making an offer for the exchange. This method will check that the offer proposal shape matches the required shape. If an invitation assets doesn’t match the issuers specified in the issuer keyword record, the seat is immediately exited and error will be returned:

```jsx
 return new Error(
     'The proposal did not match either a buy or sell order.',
 );
```

# Functionalities

### makeInvitation

When offer is issued, the contract handles it, matches an offer to the existing offers in the order book. The contract will automatically add the order to the buy or sell list. If there is a match, the swap is executed - contract will exit both seats to deliver assets to the counterparties. Otherwise, order will be added to the order book.

The invitation will require the following proposal shape:

```jsx
const proposal = harden({
	give: { (Asset | Price): x },
	want: { (Asset | Price): y }
});
```

Example: if Alice wants to trade 4 simoleans for 3 moolas and Bob wants to trade 3 moolas for 4 simoleans, they would create the following proposals:

```jsx
const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

const bobBuyOrderProposal = harden({
    give: { Price: simoleans(4n) },
    want: { Asset: moola(3n) }
  });
```

As soon as Bob issues his offer, contract will match it with the offer issued by Alice and execute the trade.

See [exchangeOfferHandler](#exchangeofferhandler) for offer handler details.

Returns an `Invitation` for exchange offers:

```jsx
// Alice creates an order to get 4 simoleans for 3 moolas
const aliceInvitation = await E(publicFacet).makeInvitation();
const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

// mint 3 moolas for Alice that she will pay to the counterparty
const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
const alicePayments = { Asset: aliceMoolaPayment };

const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );
```

### getNotifier

Returns a `NotifierRecord`. Can be used to retrieve the order book records and get updates when order book state changes.

Getting buys and sells from the order book: 

```jsx
const notifier = await E(publicFacet).getNotifier();
let {
    value: { buys, sells },
  } = await E(notifier).getUpdateSince();
```

### exchangeOfferHandler

Handler will first retrieve proposal info from the seat. If `want.Asset` is specified, the proposal is considered as a buy offer, otherwise if `give.Asset` is specified, it is considered as a sell offer. Otherwise, error will be thrown.

Then, handler will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed and the counteroffer is removed from the order book. Both seats will be exited after assets are sucessfuly transferred. If an error occurs, no assets will be transferred, and both seats will fail.

If counteroffer is not found in the order book, the offer will be added to the order book waiting for a counteroffer.

The notifier is always updated, reflecting the latest state of the order book.

# Usage and Integration

Here is the full flow of the exchange of assets between Alice and Bob:

```jsx
  // Initialize zoe
  const { zoe } = await setUpZoeForTest(() => { });

  // Mock assets
  const moolaKit = makeIssuerKit('moola');
  const simoleanKit = makeIssuerKit('simoleans');

  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);
  
  const moola = makeSimpleMake(moolaKit.brand);
  const simoleans = makeSimpleMake(simoleanKit.brand);

  // Create an instance of the contract
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../src/simpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  // Alice makes a sell order
  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );
  await E(aliceSeat).getOfferResult(); // => 'Order Added'

  // Bob makes a buy order
  const bobInvitation = await E(publicFacet).makeInvitation();
  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );
  await E(bobSeat).getOfferResult(); // => 'Order Added'
```

# Link

https://github.com/alexanderem49/simple-exchange