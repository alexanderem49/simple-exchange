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
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  let sellSeats = [];
  let buySeats = [];

  const mapOrders = (seats) =>
    seats
      .filter((s) => !s.hasExited())
      .map((seat) => ({
        want: seat.getProposal().want,
        give: seat.getProposal().give,
      }));

  const getBookOrders = () => ({
    buys: mapOrders(buySeats),
    sells: mapOrders(sellSeats),
  });

  const { notifier, updater } = makeNotifierKit(getBookOrders());
  const bookOrdersChanged = () => updater.updateState(getBookOrders());

  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

  const swapIfCanTrade = (offers, seat) => {
    for (const offer of offers) {
      if (satisfiedBy(offer, seat) && satisfiedBy(seat, offer)) {
        swap(zcf, seat, offer);
        return offer;
      }
    }
    return undefined;
  };

  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, seat) => {
    const offer = swapIfCanTrade(counterOffers, seat);
    if (offer) {
      counterOffers = counterOffers.filter((value) => value !== offer);
    } else {
      coOffers.push(seat);
    }
    bookOrdersChanged();
    return counterOffers;
  };

  const exchangeOfferHandler = (seat) => {
    const { want, give } = seat.getProposal();

    if (want.Asset) {
      sellSeats = swapIfCanTradeAndUpdateBook(sellSeats, buySeats, seat);
      return 'Order Added';
    } else if (give.Asset) {
      buySeats = swapIfCanTradeAndUpdateBook(buySeats, sellSeats, seat);
      return 'Order Added';
    } else {
      seat.exit();
      return new Error(
        'The proposal did not match either a buy or sell order.',
      );
    }
  };

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

  const creatorFacet = Far('creatorFacet', {});

  const publicFacet = Far('publicFacet', {
    makeInvitation: makeExchangeInvitation,
    getNotifier: () => notifier,
  });

  return harden({ creatorFacet, publicFacet });
};
harden(start);
export { start };
