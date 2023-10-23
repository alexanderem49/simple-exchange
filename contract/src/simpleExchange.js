import '@agoric/zoe/exported.js';
import { M } from '@agoric/store';
import { Far } from '@endo/marshal';
import { AmountShape } from '@agoric/ertp';
import { makeNotifierKit } from '@agoric/notifier';
import {
  assertIssuerKeywords,
  swap,
  satisfies,
} from '@agoric/zoe/src/contractSupport';

const start = (zcf) => {
  // The contract expects issuers to be labeled as 'Asset' and 'Price'.
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  // Store the order book in two arrays, one for buys and one for sells.
  let sellSeats = [];
  let buySeats = [];

  // Return an array of offers that have not yet exited.
  const getOffers = (seats) =>
    seats.filter((s) => !s.hasExited()).map((seat) => seat.getProposal());

  // Return full order book, both buys and sells.
  const getOrderBook = () => ({
    buys: getOffers(buySeats),
    sells: getOffers(sellSeats),
  });

  // Create a notifier that will update when the order book changes.
  const { notifier, updater } = makeNotifierKit(getOrderBook());

  // Update the notifier when the order book changes.
  const updateOrderBook = () => updater.updateState(getOrderBook());

  // Return true if the first seat is satisfied by the second seat.
  // Returns true if wants of both seats are satisfied.
  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

  // Execute swap with first satisfiable offer in the array.
  // Return the satisfiable offer, or undefined if no offer was found.
  const swapIfCanTrade = (offers, seat) => {
    for (const offer of offers) {
      if (satisfiedBy(offer, seat) && satisfiedBy(seat, offer)) {
        // When satisfiable offer is found, swap and return the offer.
        // Swap will throw if the swap fails, no assets will be transferred,
        // and both seats will fail. If the swap succeeds, both seats will
        // be exited and the assets will be transferred.
        swap(zcf, seat, offer);
        return offer;
      }
    }
    // Return undefined if no satisfiable offer was found.
    return undefined;
  };

  // Process an incoming offer. If the offer can be satisfied, swap and remove
  // the counter offer from the counterOffers array. If the offer cannot be
  // satisfied, add the offer to the counterOffers array.
  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, seat) => {
    // try to execute a swap
    const offer = swapIfCanTrade(counterOffers, seat);

    if (offer) {
      // if the swap succeeded, remove the offer from the counterOffers array
      counterOffers = counterOffers.filter((value) => value !== offer);
    } else {
      // if the swap was not executed, add the offer to the coOffers array
      coOffers.push(seat);
    }

    // notify the notifier that the order book has changed
    updateOrderBook();
    return counterOffers;
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
      sellSeats = swapIfCanTradeAndUpdateBook(sellSeats, buySeats, seat);
      return 'Order Added';
    } else if (give.Asset) {
      // If the proposal is a sell, try to execute a swap with the buy book.
      buySeats = swapIfCanTradeAndUpdateBook(buySeats, sellSeats, seat);
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

  // The creatorFacet of the contract, in this case it has no functions.
  const creatorFacet = Far('creatorFacet', {});

  // The publicFacet has a function that allows users to create invitations
  // to the contract, and a function that returns a notifier that will update
  // when the order book changes.
  const publicFacet = Far('publicFacet', {
    makeInvitation: makeExchangeInvitation,
    getNotifier: () => notifier,
  });

  // Return the facets of the contract.
  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
