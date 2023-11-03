# UpgradeableSimpleExchange

## Summary

This component allows users to execute P2P exchanges between a set of two assets on Agoric network.

## Details

The exchange contract was written with simplicity in mind. It holds the order books which is filled when users submit a buy or sell order to the contract, describing what asset they give and what asset they want. The SimpleExchange contract introduces keywords `Asset` and `Price`, which will be assigned to a specific ERTP issuer when the contract is instantiated.

When a user is building the offer proposal, if he assigns the `Asset` to the `want` keyword, and the `Price` to the `give`, this will be reflected as a `buy order`, and vice-versa for a `sell order`.

In order to execute the exchange, users have to simply issue offers to the contract with information about what they give and what they want, and provide the respective payment. As soon as that order matches with an existing or new order, the contract will execute the trade and the counterparties will receive their desired assets.

The contract is upgradeable, so its logic can be updated without having to redeploy the contract and preserving the state of the contract.

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

As this contract was written with simplicity in mind, this contract doesn’t have any dependency other that agoric-sdk itself (which depends on go, node, npm and yarn, check Agoric SDK getting started [here](https://docs.agoric.com/guides/getting-started/#getting-support)).

In order to start an upgradeable instance of the simple exchange contract it requires private args to be passed to the `startInstance` method. Private args should include the marshaller and the storage node. The storage node is used to store the contract state and the marshaller is used to serialize and deserialize the contract state. Installation reference and issuer keywords record are also required.

```jsx
  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = Far('fake marshaller', { ...makeFakeMarshaller() });

  const privateArgs = harden({ marshaller, storageNode });
  const { moolaKit, simoleanKit } = assets;

  const { publicFacet, creatorFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );
```

Note: moolaKit and simoleanKit are two issuerKits created only for testing the simpleExchange contract, as well as marshaller and storage node setup. They will be referred multiple times in this document.

## Contract Facets

The UpgradeableSimpleExchange contract exports two remotable objects, `publicFacet` and `creatorFacet`.

The `creatorFacet` has no methods, so it is empty.

The `publicFacet` has two methods:
- `makeInvitation`, which returns a `Invitation` that should be exercised when making an offer for the exchange. This method will check that the offer proposal shape matches the required shape. If an invitation asset doesn’t match the issuers specified in the issuer keyword record, the seat is immediately exited and error will be returned. 
- `getSubscriber`, which returns a `Subscriber`. It is used to retrieve current order book and get updates when order book state changes.

```jsx
  // The creatorFacet has a set of methods reserved for the contract creator.
  // In this case it is empty.
  const creatorFacet = zone.exo('CreatorFacet', undefined, {});
```

```jsx
  // The publicFacet has a set of publicly visible methods.
  // In this case it has a method that allows users to make
  // sell or buy offers, and a method that returns the order book state.
  const publicFacet = zone.exo(
    'PublicFacet',
    M.interface('publicFacetI', {
      getSubscriber: M.call().returns(SubscriberShape),
      makeInvitation: M.call().returns(M.promise()),
    }),
    {
      getSubscriber: () => subscriber,
      makeInvitation: makeExchangeInvitation,
    },
  );
```

## Functionalities

### Durable storage

The contract uses a durable storage to store the order book state. The storage is provided by the `storageNode` passed as a private arg to the `startInstance` method. The storage is used to store the order book state and the marshaller is used to serialize and deserialize the contract state. The state of durable storage is preserved when the contract is upgraded.

```jsx
  const { marshaller, storageNode } = privateArgs;

  // Create a zone whose objects persist between Agoric vat upgrades.
  const zone = makeDurableZone(baggage);

  ...

  // Create durable storages for the order book, one for buy orders and
  // one for sell orders.
  // Durable storage is a storage that persists with contract upgrades.
  // Using durable storage makes this contract upgradable without losing
  // the order book data.
  const sellSeatsMap = zone.mapStore('sellSeats');
  const buySeatsMap = zone.mapStore('buySeats');
```

### getSubscriber

Returns a durable `Subscriber` that can be used to retrieve the order book records and get updates when order book state changes.

```jsx
  // Create a recorder kit that will be used to create a durable subscriber
  // service to register the order book changes.
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);

  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });
```

### makeInvitation

When offer is issued, the contract handles it, matches an offer to the existing offers in the order book. The contract will automatically add the order to the buy or sell mapping. If there is a match, the swap is executed and the contract will exit both seats to deliver assets to the counterparties. Otherwise, order will be added to the order book.

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

The exchangeOfferHandler function holds the logic behind the contract. It is responsible for retrieving proposal from the user seat and verify if it is a buy or sell order. Also the handler will validate if the issuer of the Asset and Price are the same as the ones defined in the contract.

Then, handler will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed and the counteroffer is removed from the order book. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.  

If counteroffer is not found in the order book, the offer will be added to the order book waiting for a counteroffer.  

The subscriber is always updated, reflecting the latest state of the order book.  

```jsx
  // The invitation handler will retrieve the offer proposal and based on it,
  // it will identify if it is a sell or buy order, and act accordingly.
  const exchangeOfferHandler = (seat) => {
    const { want, give } = seat.getProposal();

    // Validate that the issuer of the Asset and Price are the same as the
    // ones defined in the contract.
    const asset = want.Asset || give.Asset;
    const price = want.Price || give.Price;

    if (asset.brand !== Asset || price.brand !== Price) {
      seat.fail();
      return new Error('Brand mismatch');
    }

    // A Buy order is an offer that wants Asset and gives Price and vice-versa.
    // Based on the order, the contract will try to execute an exchange with the
    // respective counterOffers list.
    if (want.Asset) {
      swapIfCanTradeAndUpdateBook(sellSeatsMap, buySeatsMap, seat);
      return 'Order Added';
    } else if (give.Asset) {
      swapIfCanTradeAndUpdateBook(buySeatsMap, sellSeatsMap, seat);
      return 'Order Added';
    }
  };
```

### swapIfCanTradeAndUpdateBook

This function is responsible for executing the trade and updating the order book. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed and the counteroffer is removed from the order book. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

```jsx
  // Process an incoming offer. If the offer can be satisfied, swap and remove
  // the counter offer from the counterOffers storage. If the offer cannot be
  // satisfied, add the seat to the counterOffers storage.
  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, userSeat) => {
    const seat = swapIfCanTrade(counterOffers, userSeat);

    if (seat) {
      counterOffers = counterOffers.delete(seat);
    } else {
      coOffers.init(userSeat, userSeat.getProposal());
    }

    // Update the subscriber state with the changes made to the order book.
    updateOrderBook();
  };
```

### swapIfCanTrade

This function is responsible for executing the swap. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

This method uses `swap` and `satisfies` methods from `@agoric/zoe/src/contractSupport` to execute the swap.

The `swap` method tries to execute the swap between two seats. Both seats must satisfy wants of each other and keywords for both seats must match. If there is a surplus, it will remain with the original seat, for example if Alice gives 5 moolas and Bob wants only 3 moolas, Alice will retain 2 moolas. If an error occurs, no assets will be transferred, and both seats will fail. Otherwise, both seats will be exited and assets will be successfully transferred.

The `satisfies` method checks if the offer proposal satisfies the wants of the counteroffer. It will return true if the offer proposal satisfies the wants of the counteroffer, false otherwise. Like with example above, supluses are accounted. In the exchange contract this method is called twice to check that wants of both seats can satisfy each other.

Therefore, the exchange contract proprerly handles the surplus case, when one party gives more than the other party wants - the surplus will remain with the original seat. Example: if Alice wants to trade 5 moolas for 3 simoleans and Bob wants to trade 3 simoleans for 4 moolas, the contract will execute the trade and Alice will retain 1 moola.

```jsx
  // Execute swap with first satisfiable offer in the storage.
  // Return the user seat that made the satisfiable offer, or
  // undefined if no offer was found.
  const swapIfCanTrade = (seatsMap, userSeat) => {
    for (const seat of seatsMap.keys()) {
      // Calls satisfiedBy() on both orders of the two seats. If both
      // satisfy each other, it does a swap on them.
      if (satisfiedBy(seat, userSeat) && satisfiedBy(userSeat, seat)) {
        // When satisfiable offer is found, swap and return the user seat.
        // Swap will throw if the swap fails, no assets will be transferred,
        // and both seats will fail. If the swap succeeds, both seats will
        // be exited and the assets will be transferred.
        swap(zcf, userSeat, seat);
        return seat;
      }
    }

    return undefined;
  };
```

## Usage and Integration

A step-by-step guide on how the contract can be used and deployed, along with the dependencies that must be installed can be found in the [Tutorial](tutorial.md) file in the project repository.

There is also an extensive list of tests is also a good way to understand and showcase the multiple scenarios and behaviors expected by the simpleExchange contract.

## Link

https://github.com/alexanderem49/simple-exchange
