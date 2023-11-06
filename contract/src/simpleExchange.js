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
  // The contract expects proposals for this contract instance
  // should use keywords 'Asset' and 'Price'.
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  // Store the users seats in two arrays, one for buys and one for sells offers.
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

  // Create a notifier service that will update when the order book changes.
  const { notifier, updater } = makeNotifierKit(getOrderBook());

  // Update the notifier state when the order book changes.
  const updateOrderBook = () => updater.updateState(getOrderBook());

  // Checks if the second seat argument's currentAllocation satisfies the
  // first seat argument's proposal.want. Returns true if satisfied.
  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

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

  // The invitation handler will retrieve the offer proposal and based on it,
  // it will identify if it is a sell or buy order, and act accordingly.
  const exchangeOfferHandler = (seat) => {
    const { want, give } = seat.getProposal();

    const { Asset, Price } = zcf.getTerms().brands;

    // Validate that the brands of the Asset and Price are the same as the
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
      swapIfCanTradeAndUpdateBook(sellSeats, buySeats, seat);
      return 'Order Added';
    } else if (give.Asset) {
      swapIfCanTradeAndUpdateBook(buySeats, sellSeats, seat);
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
  const creatorFacet = Far('creatorFacet', {});

  // The publicFacet has a set of publicly visible methods.
  // In this case it has a method that allows users to make
  // sell or buy offers, and a method that returns the order book state.
  const publicFacet = Far('publicFacet', {
    makeInvitation: makeExchangeInvitation,
    getNotifier: () => notifier,
  });

  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
