# UpgradeableSimpleExchange

This component allows users to execute P2P exchanges between a set of two assets on Agoric network.

## Details

The SimpleExchange was written with simplicity in mind. It holds the order books which is filled when users submit a buy or sell order to the contract, describing what asset they give and what asset they want. The contract introduces the keywords `Asset` and `Price`, which will be assigned to a specific ERTP issuer when the contract is instantiated.

When a user is building the offer proposal, if he assigns the keyword `Asset` to `want`, and the `Price` to `give`, this will be reflected as a `buy order`, and vice-versa for a `sell order`.

To execute the exchange, users have to simply issue offers to the contract with information about what they give and what they want, and provide the respective payment. As soon as that order matches with an existing or new order, the contract will execute the trade and the counterparties will receive their desired assets.

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

In order to start an upgradeable instance of the SimpleExchange contract, it requires the privateArgs to be passed to the `startInstance` method. The private arguments should include the marshaller and the storage node. The storage node is used to store the contract state on the chainStorage, and the marshaller is used to encode the data before being published on the storageNode. The Installation reference and the issuer keywords record are also required.


```jsx
const issuerKeywordRecord = harden({
    Asset: assetIssuer,
    Price: priceIssuer,
  });

  const privateArgs = harden({ marshaller, storageNode });

  const installation = await simpleExchangeInstallation;

  const instanceFacets = await E(zoe).startInstance(
    installation,
    issuerKeywordRecord,
    undefined,
    privateArgs,
    'simpleExchange',
  );
```

## Contract Facets

The UpgradeableSimpleExchange contract exports two remotable objects, `publicFacet` and `creatorFacet`.

The `creatorFacet` has no methods, so it is empty.

The `publicFacet` has two methods:
- `makeInvitation`, which returns a `Invitation`, that can be exercised for making an offer with the sell or buy order that the user which to execute.
- `getSubscriber`, which returns a `Subscriber` service, that can be used to retrieve current order book and get updates when its state changes.

```jsx
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

## Durable objects and storage
ToDo: complete this section

The contract uses a durable storage to store the order book state. The storage is provided by the `storageNode` passed as a private argument to the `startInstance` method. The storage is used to store the order book state and the marshaller is used to serialize and deserialize the contract state. The state of durable storage is preserved when the contract is upgraded.

```jsx
  const { marshaller, storageNode } = privateArgs;
```

Address the zone API
```jsx
  const zone = makeDurableZone(baggage);
```

Address durable storage and objects
```jsx
  const sellSeatsMap = zone.mapStore('sellSeats');
  const buySeatsMap = zone.mapStore('buySeats');
```


```jsx
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);

  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });
```

## Functionalities

### makeInvitation

The makeInvitation method will validate if the proposalShape of the offer submitted is aligned with the pattern defined bellow, if so, it will call the exchangeOfferHandler.

```jsx
  const makeExchangeInvitation = () => {
    return zcf.makeInvitation(
      exchangeOfferHandler,
      'exchange',
      undefined,
      M.splitRecord({
        give: M.or({ Asset: AmountShape }, { Price: AmountShape }),
        want: M.or({ Asset: AmountShape }, { Price: AmountShape }),
      }),
    );
  };
```

### exchangeOfferHandler

The exchangeOfferHandler function is responsible for retrieving proposal from the user seat, which will be useful to verify if it is a buy or sell order.
There is also the necessity to validate if the brands of the Asset and Price are the same as the ones defined when contract was instantiated because ...

After identifying the type of order that is being submited, the swapIfCanTradeAndUpdateBook method will be called, where the order of the map of user seats passed as arguments will defer because ...

The swapIfCanTradeAndUpdateBook is responsible for updating the maps of buys and sells orders based on the returned object from the swapIfCanTrade method ...

ToDo: complete the sentences above


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

ToDo: I would remove the section (swapIfCanTradeAndUpdateBook) since we can explain its logic on the section above and avoid repeating information

### swapIfCanTrade

This function is responsible for executing the exchange. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

This method uses `swap` and `satisfies` methods from `@agoric/zoe/src/contractSupport` to execute the swap.

The `swap` method tries to execute the swap between two seats. Both seats must satisfy wants of each other and keywords for both seats must match. If there is a surplus, it will remain with the original seat, for example if Alice gives 5 moolas and Bob wants only 3 moolas, Alice will receive the 2 moolas back. If an error occurs, no assets will be transferred, and both seats will fail. Otherwise, both seats will be exited and assets will be successfully transferred.

The `satisfies` method checks if the offer proposal satisfies the wants of the counteroffer. It will return true if the offer proposal satisfies the wants of the counteroffer, false otherwise. Like with example above, surpluses are accounted. In the exchange contract this method is called twice to check that wants of both seats can satisfy each other.

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

## Subscriptions

ToDo: describe the state data that is being recorded, when it is updated. 
Also, mention why we add the brands to the state

## Usage and Integration

A step-by-step guide on how the contract can be used and deployed, along with the dependencies that must be installed can be found in the [Tutorial](tutorial.md) file in the project repository.

There is also an extensive list of tests is also a good way to understand and showcase the multiple scenarios and behaviors expected by the simpleExchange contract.

## Link

https://github.com/alexanderem49/simple-exchange
