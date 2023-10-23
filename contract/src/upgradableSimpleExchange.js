import { AmountShape } from '@agoric/ertp';
import {
  prepareExo,
  M,
  makeScalarBigMapStore,
  provide,
} from '@agoric/vat-data';
import { provideAll } from '@agoric/zoe/src/contractSupport';
import {
  assertIssuerKeywords,
  SubscriberShape,
  prepareRecorderKitMakers,
  swap,
  satisfies,
} from '@agoric/zoe/src/contractSupport';

const prepare = async (zcf, privateArgs, baggage) => {
  const { marshaller, storageNode } = privateArgs;

  // The contract expects issuers to be labeled as 'Asset' and 'Price'.
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  // Create a recorder kit that will be used to create a subscriber for
  // the order book changes.
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);
  // Create a subscriber that will update when the order book changes.
  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });

  // Create storages for the order book, one for buys and one for sells.
  const sellSeatsMap = provide(baggage, 'sellSeats', () =>
    makeScalarBigMapStore('sellSeats', { durable: true }),
  );
  const buySeatsMap = provide(baggage, 'buySeats', () =>
    makeScalarBigMapStore('buySeats', { durable: true }),
  );

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

  // Return full order book, both buys and sells.
  const getOrderBook = () => ({
    buys: getOffers(buySeatsMap),
    sells: getOffers(sellSeatsMap),
  });

  const updateOrderBook = () => recorder.write(getOrderBook());
  updateOrderBook();

  // Return true if the first seat is satisfied by the second seat.
  // Returns true if wants of both seats are satisfied.
  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

  // Execute swap with first satisfiable offer in the storage.
  // Return the satisfiable offer, or undefined if no offer was found.
  const swapIfCanTrade = (seatsMap, userSeat) => {
    for (const seat of seatsMap.keys()) {
      if (satisfiedBy(seat, userSeat) && satisfiedBy(userSeat, seat)) {
        // When satisfiable offer is found, swap and return the offer.
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
  // satisfied, add the offer to the counterOffers storage.
  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, userSeat) => {
    // try to execute a swap
    const seat = swapIfCanTrade(counterOffers, userSeat);
    if (seat) {
      counterOffers = counterOffers.delete(seat);
    } else {
      coOffers.init(userSeat, userSeat.getProposal());
    }

    // notify the subscriber that the order book has changed.
    updateOrderBook();
  };

  // Handle an incoming offer. It checks if the order book has an offer
  // that can be satisfiable for both parties. If so, the swap is executed
  // immediately. If not, the offer is added to the order book. Handler will
  // throw and exit incoming offer seat immediately if the proposal is 
  // not a buy or sell order.
  const exchangeOfferHandler = (seat) => {
    // Get the proposal from the seat.
    const { want, give } = seat.getProposal();

    if (want.Asset) {
      // If the proposal is a buy, try to execute a swap with the sell book.
      swapIfCanTradeAndUpdateBook(sellSeatsMap, buySeatsMap, seat);
      return 'Order Added';
    } else if (give.Asset) {
      // If the proposal is a sell, try to execute a swap with the buy book.
      swapIfCanTradeAndUpdateBook(buySeatsMap, sellSeatsMap, seat);
      return 'Order Added';
    } else {
      // If the proposal is neither a buy nor a sell, exit the seat and throw.
      seat.exit();
      return new Error(
        'The proposal did not match either a buy or sell order.',
      );
    }
  };

  // Create an invitation to the contract. The incoming offer will be handled
  // by the exchangeOfferHandler function. Incoming offer seat must match the
  // proposal shape defined by the contract - both give and want must be either
  // Asset or Price.
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

  // The publicFacet has a function that allows users to create invitations
  // to the contract, and a function that returns a subscriber that will update
  // when the order book changes.
  const publicFacet = prepareExo(
    baggage,
    'publicFacet',
    M.interface('publicFacetI', {
      getSubscriber: M.call().returns(SubscriberShape),
      makeInvitation: M.call().returns(M.promise()),
    }),
    {
      getSubscriber: () => subscriber,
      makeInvitation: makeExchangeInvitation,
    },
  );

  // The creatorFacet of the contract, in this case it has no functions.
  const creatorFacet = prepareExo(
    baggage,
    'creatorFacet',
    M.interface('creatorFacetI', {}),
    {},
  );

  // Return the facets of the contract.
  return harden({ creatorFacet, publicFacet });
};

harden(prepare);
export { prepare };
