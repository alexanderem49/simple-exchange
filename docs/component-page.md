# SimpleExchange

## Summary

This component allows users to execute P2P exchanges between a set of two assets on Agoric network.

## Details

The exchange contract was written with simplicity in mind. It holds the order books which is filled when users submit a buy or sell order to the contract, describing what asset they give and what asset they want. The SimpleExchange contract introduces keywords `Asset` and `Price`, which will be assigned to a specific ERTP issuer when the contract is instantiated.
When a user is building the offer proposal, if he assigns the `Asset` to the `want` keyword, and the `Price` to the `give`, this will be reflected as a `buy order`, and vice-versa for a `sell order`.

In order to execute the exchange, users have to simply issue offers to the contract with information about what they give and what they want, and provide the respective payment. As soon as that order matches with an existing or new order, the contract will execute the trade and the counterparties will receive their desired assets.

## Dependencies

There are some previous considerations to have before instantiating this contract.
The first one is related to the agoric-sdk version used at the moment of its development. The tag returned by running the command `git describe --tags --always` is `@agoric/cache@0.3.3-u11.0`, so it is advised to check out to the same state when exploring this component and test if any major update is required in order to be implemented at the desired agoric-sdk version.

```bash
go version # go version go1.20.6 darwin/arm64
node --version # v18.18.0
npm --version # 9.8.1
yarn --version # 1.22.5

# inside agoric-sdk folder
`git checkout 92b6cd72484079b0349d8ccfa4510aeb820e8d67`
yarn install && yarn build
agoric --version # 0.21.2-u11.0
```

When the contract is instantiated, the terms should specify the AMM publicFacet, the secondary issuer, the LP token issuer, the central issuer, and the initial boundaries.
The issuerKeywordRecord should also be specified with Central, Secondary and LpToken, being each one related to his corresponding issuer.

As this contract was written with simplicity in mind, this contract doesn’t have any dependency other that agoric-sdk itself (which depends on go, node, npm and yarn, check Agoric SDK getting started [here](https://docs.agoric.com/guides/getting-started/#getting-support)).

In order to start an instance of the simple exchange contract it does not require any privateArgs. Only the `installation` reference and the `issuerKeywordRecord`, which in example described above should be following:

```jsx
const { publicFacet, instance } = await E(zoe).startInstance(
  contractInstallation,
  harden({
    Asset: moolaKit.issuer,
    Price: simoleanKit.issuer,
  }),
);
```

Note: moolaKit and simoleanKit are two issuerKits created only for testing the simpleExchange contract. They will be referred multiple times in this document.

## Contract Facets

The SimpleExchange contract exports two remotable objects, publicFacet and creatorFacet.

The creatorFacet has no methods, so it is empty.

The publicFacet has two methods:
- `makeInvitation`, which returns a `Invitation` that should be exercised when making an offer for the exchange. This method will check that the offer proposal shape matches the required shape. If an invitation asset doesn’t match the issuers specified in the issuer keyword record, the seat is immediately exited and error will be returned. 
- `getNotifier`, which returns a `NotifierRecord`. It is used to retrieve current order book and get updates when order book state changes.

```jsx
const creatorFacet = Far('creatorFacet', {});
```

```jsx
const publicFacet = Far('publicFacet', {
  makeInvitation: makeExchangeInvitation,
  getNotifier: () => notifier,
});
```

## Functionalities

### makeInvitation

When offer is issued, the contract handles it, matches an offer to the existing offers in the order book. The contract will automatically add the order to the buy or sell list. If there is a match, the swap is executed and the contract will exit both seats to deliver assets to the counterparties. Otherwise, order will be added to the order book.

The invitation will require the following proposal shape (where `x` and `y` are amounts):

```jsx
const proposal = harden({
	give: { (Asset | Price): x },
	want: { (Asset | Price): y }
});
```

Example: if Alice wants to trade 4 simoleans for 3 moolas and Bob wants to trade 3 moolas for 4 simoleans, they would create the following proposals and provide the respective payment:

```jsx
const aliceSellOrderProposal = harden({
  give: { Asset: moola(3n) },
  want: { Price: simoleans(4n) },
});
```

As soon as Bob issues his offer below, contract will match it with the offer issued by Alice and execute the trade.

```jsx
const bobBuyOrderProposal = harden({
  give: { Price: simoleans(4n) },
  want: { Asset: moola(3n) },
});
```

### exchangeOfferHandler

The exchangeOfferHandler function holds the logic behind the contract. It is responsible for retrieving proposal from the user seat and verify if it is a buy or sell order.

Then, handler will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed and the counteroffer is removed from the order book. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.  

If counteroffer is not found in the order book, the offer will be added to the order book waiting for a counteroffer.  

The notifier is always updated, reflecting the latest state of the order book.  

```jsx
  const exchangeOfferHandler = (seat) => {
    const { want, give } = seat.getProposal();

    // A Buy order is an offer that wants Asset and gives Price and vice-versa.
    // Based on the order, the contract will try to execute an exchange with the
    // respective counterOffers list.
    if (want.Asset) {
      swapIfCanTradeAndUpdateBook(sellSeats, buySeats, seat);
      return 'Order Added';
    } else if (give.Asset) {
      swapIfCanTradeAndUpdateBook(buySeats, sellSeats, seat);
      return 'Order Added';
    }
  };
```

### swapIfCanTradeAndUpdateBook

This function is responsible for executing the trade and updating the order book. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed and the counteroffer is removed from the order book. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

```jsx
  // Process an incoming offer. If the offer can be satisfied, swap and remove
  // the counter offer from the counterOffers array. If the offer cannot be
  // satisfied, add the seat to the coOffers array.
  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, seat) => {
    const offer = swapIfCanTrade(counterOffers, seat);

    if (offer) {
      counterOffers = counterOffers.filter((value) => value !== offer);
    } else {
      coOffers.push(seat);
    }

    // Update the notifier state with the changes made to the order book.
    updateOrderBook();
  };
```

### swapIfCanTrade

This function is responsible for executing the swap. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

This method uses `swap` and `satisfies` methods from `@agoric/zoe/src/contractSupport` to execute the swap.

The `swap` method tries to execute the swap between two seats. Both seats must satisfy wants of each other and keywords for both seats must match. If there is a surplus, it will remain with the original seat, for example if Alice gives 5 moolas and Bob wants only 3 moolas, Alice will retain 2 moolas. If an error occurs, no assets will be transferred, and both seats will fail. Otherwise, both seats will be exited and assets will be successfully transferred.

The `satisfies` method checks if the offer proposal satisfies the wants of the counteroffer. It will return true if the offer proposal satisfies the wants of the counteroffer, false otherwise. Like with example above, supluses are accounted.

```jsx
  // Execute swap with first satisfiable offer in the array.
  // Return the user seat that made the satisfiable offer, or
  // undefined if no offer was found.
  const swapIfCanTrade = (offers, seat) => {
    for (const offer of offers) {
      // Calls satisfiedBy() on both orders of the two seats. If both
      // satisfy each other, it does a swap on them.
      if (satisfiedBy(offer, seat) && satisfiedBy(seat, offer)) {
        // When satisfiable offer is found, swap and return the user seat.
        // Swap will throw if the swap fails, no assets will be transferred,
        // and both seats will fail. If the swap succeeds, both seats will
        // be exited and the assets will be transferred.
        swap(zcf, seat, offer);
        return offer;
      }
    }

    return undefined;
  };
```

### getNotifier

Returns a `NotifierRecord` that can be used to retrieve the order book records and get updates when order book state changes.

```jsx
const notifier = await E(publicFacet).getNotifier();
let {
  value: { buys, sells },
} = await E(notifier).getUpdateSince();
```

## Usage and Integration

A step-by-step guide on how the contract can be used and deployed, along with the dependencies that must be installed can be found in the [Tutorial](tutorial.md) file in the project repository.

There is also an extensive list of tests is also a good way to understand and showcase the multiple scenarios and behaviors expected by the simpleExchange contract.

## Link

https://github.com/alexanderem49/simple-exchange
