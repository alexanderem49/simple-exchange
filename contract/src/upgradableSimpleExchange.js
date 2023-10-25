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

  // Create a recorder kit that will be used to create a subscriber for
  // the order book changes.
  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);
  // Create a subscriber that will update when the order book changes.
  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });

  // Create durable storages for the order book, one for buy offers and
  // one for sell offers.
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
    // Return undefined if no satisfiable offer was found.
    return undefined;
  };

  // Process an incoming offer. If the offer can be satisfied, swap and remove
  // the counter offer from the counterOffers storage. If the offer cannot be
  // satisfied, add the seat to the counterOffers storage.
  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, userSeat) => {
    // try to execute a swap
    const seat = swapIfCanTrade(counterOffers, userSeat);

    if (seat) {
      // if the swap succeeded, remove the offer from the counterOffers storage
      counterOffers = counterOffers.delete(seat);
    } else {
      // if the swap was not executed, add the offer to the coOffers storage
      coOffers.init(userSeat, userSeat.getProposal());
    }

    // Update the subscriber state with the changes made to the order book.
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

    // Check if the proposal is a buy or sell offer.

    // Buy offer is an offer that wants Asset and gives Price, give.Asset
    // in this case is undefined.

    // Sell offer is an offer that wants Price and gives Asset, want.Asset
    // in this case is undefined.
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
  // by the exchangeOfferHandler function. Incoming offerProposal must match the
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

  const creatorFacet = zone.exo('CreatorFacet', undefined, {});

  return harden({ creatorFacet, publicFacet });
};

harden(prepare);
export { prepare };
