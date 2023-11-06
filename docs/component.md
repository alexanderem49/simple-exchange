# UpgradeableSimpleExchange

This component allows users to execute P2P exchanges between a set of two assets on the Agoric network.

## Details

The SimpleExchange was written with simplicity in mind. It holds the order books which are filled when users submit a buy or sell order to the contract, describing what asset they give and what asset they want. The contract introduces the keywords `Asset` and `Price`, which will be assigned to a specific ERTP issuer when the contract is instantiated.

When a user is building the offer proposal, if he assigns the keyword `Asset` to `want`, and the `Price` to `give`, this will be reflected as a `buy order`, and vice-versa for a `sell order`.

To execute the exchange, users have to simply issue offers to the contract with information about what they give and what they want, and provide the respective payment. As soon as that order matches with an existing or new order, the contract will execute the trade and the counterparties will receive their desired assets.

The contract is upgradeable, so its logic can be updated without having to redeploy the contract and preserve the state of the contract.

## Dependencies

There are some previous considerations to have before instantiating this contract.
The first one is related to the agoric-sdk version used at the moment of its development. The tag returned by running the command `git describe --tags --always` is `@agoric/cache@0.3.3-u11.0`, so it is advised to check out to the same state when exploring this component and test if any major update is required to be implemented at the desired agoric-sdk version.

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

As this contract was written with simplicity in mind, this contract doesn’t have any dependency other than agoric-sdk itself (which depends on go, node, npm, and yarn, check Agoric SDK getting started [here](https://docs.agoric.com/guides/getting-started/#getting-support)).

To start an upgradeable instance of the SimpleExchange contract, it requires the privateArgs to be passed to the `startInstance` method. The private arguments should include the marshaller and the storage node. The storage node is used to store the contract state on the `chainStorage`, and the marshaller is used to encode the data before being published on the `storageNode`. The Installation reference and the issuer keywords record are also required.

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

- `makeInvitation`, which returns an `Invitation`, that can be exercised for making an offer with the sell or buy order that the user which to execute.
- `getSubscriber`, which returns a `Subscriber` service, that can be used to retrieve the current order book and get updates when its state changes.

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

The simpleExchange contract resort to the [zone API](https://github.com/Agoric/agoric-sdk/tree/master/packages/zone#readme) to provide a unified model for creating Durable objects. Durable objects are those that can survive a [vat upgrade](https://github.com/Agoric/agoric-sdk/blob/master/packages/SwingSet/docs/vat-upgrade.md?plain=1), to be passed forward from one vat incarnation to the next. This means that all the data needed for the successor vat to resume operation should be durable.

In this contract, we create 2 durable storage called sellSeatsMap and buySeatsMap, whose purpose is to hold the seat-offer pair for each order made. Every time the contract is upgraded, the contract will verify if in the baggage there already exists a key with the labels 'sellSeats' and 'buySeats'. If not, it will create a new storage. If yes, it will return the previously created storage with the respective list of orders made.

```jsx
const sellSeatsMap = zone.mapStore('sellSeats');
const buySeatsMap = zone.mapStore('buySeats');
```

The `makeRecorderKit` method is suitable for making a durable RecorderKit which can be held in Exo state.
It wraps a Publisher to record all the values passed to it into chain storage.

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

The makeInvitation method will validate if the proposalShape of the offer submitted is aligned with the pattern defined below, if so, it will call the `exchangeOfferHandler`.

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

The `exchangeOfferHandler` function is responsible for retrieving proposals from the user seat, which will be useful to verify if it is a buy or sell order.

There is also the necessity to validate if the brands of the Asset and Price are the same as the ones defined when the contract was instantiated. That is done to eliminate the possibility of a user submitting an offer with a different brand than the one defined specifically for the Asset and Price. Without this validation, if the contract deployed with Asset brand as moola and Price brand as simolean, a user could submit an offer with Asset brand as simolean and Price brand as moola, which would be invalid.

After identifying the type of order that is being submitted, the `swapIfCanTradeAndUpdateBook` method will be called, where the order of the map of user seats passed as arguments, where 1 argument is the map of user seats that will be used to find a counteroffer, and the other argument is the map of user seats that will be used to store the new order.

The `swapIfCanTradeAndUpdateBook` is responsible for updating the maps of buys and sells orders based on the returned object from the `swapIfCanTrade` method - if it is able to find a counteroffer and execute the trade, the counteroffer will be returned and it will be removed from the map, otherwise, undefined will be returned and the order will be added to the map.

```jsx
// The invitation handler will retrieve the offer proposal and based on it,
//It will identify if it is a sell or buy order, and act accordingly.
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

### swapIfCanTrade

This function is responsible for executing the exchange. It will try to find a counteroffer in the order book that will satisfy an offer. If an offer is found, the swap is then executed. Both seats will be exited after assets are successfully transferred. If an error occurs, no assets will be transferred, and both seats will fail.

This method uses `swap` and `satisfies` methods from `@agoric/zoe/src/contractSupport` to execute the swap.

The `swap` method tries to execute the swap between two seats. Both seats must satisfy the wants of each other and keywords for both seats must match. If there is a surplus, it will remain with the original seat, for example, if Alice gives 5 moolas and Bob wants only 3 moolas, Alice will receive the 2 moolas back. If an error occurs, no assets will be transferred, and both seats will fail. Otherwise, both seats will be exited and assets will be successfully transferred.

The `satisfies` method checks if the offer proposal satisfies the wants of the counteroffer. It will return true if the offer proposal satisfies the wants of the counteroffer, false otherwise. Like with the example above, surpluses are accounted for. In the exchange contract this method is called twice to check that the wants of both seats can satisfy each other.

```jsx
// Execute swap with the first satisfiable offer in the storage.
// Return the user seat that made the satisfiable offer, or
// undefined if no offer was found.
const swapIfCanTrade = (seatsMap, userSeat) => {
  for (const seat of seatsMap.keys()) {
    // Calls satisfiedBy() on both orders of the two seats. If both
    // satisfy each other, it swaps them.
    if (satisfiedBy(seat, userSeat) && satisfiedBy(userSeat, seat)) {
      // When a satisfactory offer is found, swap and return the user seat.
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

We use the subscriber service to notify users when the order book state changes. The subscriber service is provided by the `recorderKit`, and it is used to record the state of the contract, and it is used to notify users when the order book state changes.

The SimpleExchange contract state record includes the Asset and Price brand and the order book state.
The brand data is included so the dApp UI can identify the brands of the Asset and Price that are being used by the contract by querying the chain storage.
The order book state is composed of two key-value map of buy and sell orders. Both maps are composed of the list of user seats and their offers.

```jsx
const getOrderBook = () => ({
  state: {
    brands: {
      Asset,
      Price,
    },
    orderBook: {
      buys: getOffers(buySeatsMap),
      sells: getOffers(sellSeatsMap),
    },
  },
});
```

## Usage and Integration

A step-by-step guide on how the contract can be used and deployed, along with the dependencies that must be installed can be found in the [Tutorial](tutorial.md) file in the project repository.

There is also an extensive list of tests is also a good way to understand and showcase the multiple scenarios and behaviors expected by the simpleExchange contract.

## Link

https://github.com/alexanderem49/simple-exchange
