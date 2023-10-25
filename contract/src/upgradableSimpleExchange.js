import { M } from '@agoric/vat-data';
import { AmountShape } from '@agoric/ertp';
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
  const { marshaller, storageNode } = privateArgs;
  const zone = makeDurableZone(baggage);

  // The contract expects proposals for this contract instance
  // should use keywords 'Asset' and 'Price'.
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  // Create a recorder kit that will be used to create a durable subscriber
  // service to register the order book changes.
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);

  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });

  // Create durable storages for the order book, one for buy orders and
  // one for sell orders.
  // Durable storage is a storage that persists with contract upgrades.
  // Using durable storage makes this contract upgradable without losing
  // the order book data.
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

  // Return full order book, both buys and sells.
  const getOrderBook = () => ({
    buys: getOffers(buySeatsMap),
    sells: getOffers(sellSeatsMap),
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
