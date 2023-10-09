import '@agoric/zoe/exported.js';
import { M } from '@agoric/store';
import { AmountMath, AmountShape } from '@agoric/ertp';
import { assertIssuerKeywords } from '@agoric/zoe/src/contractSupport';
import { makeNotifierKit } from '@agoric/notifier';

const start = (zcf) => {
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  let sellSeats = [];
  let buySeats = [];

  const { notifier, updater } = makeNotifierKit(getBookOrders());

  function dropExit(p) {
    return {
      want: p.want,
      give: p.give,
    };
  }

  function flattenOrders(seats) {
    const activeSeats = seats.filter((s) => !s.hasExited());
    return activeSeats.map((seat) => dropExit(seat.getProposal()));
  }

  function getBookOrders() {
    return {
      buys: flattenOrders(buySeats),
      sells: flattenOrders(sellSeats),
    };
  }

  // Tell the notifier that there has been a change to the book orders
  function bookOrdersChanged() {
    updater.updateState(getBookOrders());
  }

  function swapIfCanTrade(offers, userSeat) {
    const userAllocation = userSeat.getCurrentAllocation();
    for (const offer of offers) {
      const offerAllocation = offer.getCurrentAllocation();
      if (AmountMath.isEqual(userAllocation, offerAllocation)) {
        zcf.atomicRearrange(
          harden([
            [userSeat, offer, offer.getProposal().want],
            [offer, userSeat, userSeat.getProposal().want],
          ]),
        );
        return offer;
      }
    }
    return undefined;
  }

  function swapIfCanTradeAndUpdateBook(counterOffers, coOffers, seat) {
    const offer = swapIfCanTrade(counterOffers, seat);
    if (offer) {
      // remove the matched offer.
      counterOffers = counterOffers.filter((value) => value !== offer);
    } else {
      // Save the order in the book
      coOffers.push(seat);
    }
    bookOrdersChanged();
    return counterOffers;
  }

  const exchangeOfferHandler = (seat) => {
    const proposal = seat.getProposal();

    if (proposal.want.Asset) {
      sellSeats = swapIfCanTradeAndUpdateBook(sellSeats, buySeats, seat);
      return 'Order Added';
    } else if (proposal.give.Asset) {
      buySeats = swapIfCanTradeAndUpdateBook(buySeats, sellSeats, seat);
      return 'Order Added';
    } else {
      // verify if this condition is still necessary
      seat.exit();
      return new Error(
        `The proposal did not match either a buy or sell order.`,
      );
    }
  };

  const makeExchangeInvitation = () => {
    zcf.makeInvitation(
      exchangeOfferHandler,
      'exchange',
      undefined,
      M.splitRecord({
        give: M.or({ Asset: AmountShape }, { Price: AmountShape }),
        want: M.or({ Asset: AmountShape }, { Price: AmountShape }),
      }),
    );
  };

  const creatorFacet = Far('creatorFacet', {});

  const publicFacet = Far('publicFacet', {
    makeInvitation: makeExchangeInvitation,
    getNotifier: () => notifier,
  });

  return harden({ creatorFacet, publicFacet });
};
harden(start);
export { start };
