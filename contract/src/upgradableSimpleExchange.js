import { M } from '@agoric/vat-data';
import { AmountShape, AmountMath } from '@agoric/ertp';
import { makeDurableZone } from '@agoric/zone/durable.js';
import { provideAll } from '@agoric/zoe/src/contractSupport';
import {
  assertIssuerKeywords,
  SubscriberShape,
  prepareRecorderKitMakers,
  swap,
  satisfies,
} from '@agoric/zoe/src/contractSupport';

const prepare = async (zcf, privateArgs, baggage) => {
  // 
  const { marshaller, storageNode } = privateArgs;

  //Create a zone whose objects persist between Agoric vat upgrades.
  const zone = makeDurableZone(baggage);

  // get the Asset and Price brands and store it in a durable storage
  const { brands } = zcf.getTerms();
  const brandsList = zone.mapStore('brandsList');
  if (!brandsList.has('simpleExchangeBrandsList')) {
    brandsList.init('simpleExchangeBrandsList', brands);
  }
  const { Asset, Price } = brandsList.get('simpleExchangeBrandsList');

  // The contract expects proposals for this contract instance
  // should use keywords 'Asset' and 'Price'.
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  // Wrap a Publisher to record all the order book changes to chain storage.
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);
  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });

  // Create durable storage for the order book, one map for buy orders and
  // one for sell orders.
  const sellSeatsMap = zone.mapStore('sellSeats');
  const buySeatsMap = zone.mapStore('buySeats');

  // Return an array of offers that have not yet exited.
  const getOffers = (seatsMap) => {
    let offerList = [];
    for (const [seat, offer] of seatsMap.entries()) {
      if (seat.hasExited()) {
        seatsMap.delete(seat);
      } else {
        offerList.push(offer);
      }
    }
    return offerList;
  };

  // Return a state that includes the brands associated with the Asset and Price,
  // as well as the order book, both buys and sells.
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

  // Update the subscriber state when the order book changes.
  const updateOrderBook = () => recorder.write(getOrderBook());
  updateOrderBook();

  // Checks if the second seat argument's currentAllocation satisfies the
  // first seat argument's proposal.want. Returns true if satisfied.
  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

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

    // Validate there are not empty values on the offer amounts
    assert(!AmountMath.isEmpty(asset), 'Asset value should not be empty');
    assert(!AmountMath.isEmpty(price), 'Price value should not be empty');

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

  // Creates a zoe invitation, which when exercised, the offer proposalShape must
  // match the one defined below - both give and want keyword must be either
  // Asset or Price, and an amount needs to be provided for both.
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

  // The creatorFacet has a set of methods reserved for the contract creator.
  // In this case it is empty.
  const creatorFacet = zone.exo('CreatorFacet', undefined, {});

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

  return harden({ creatorFacet, publicFacet });
};

harden(prepare);
export { prepare };
