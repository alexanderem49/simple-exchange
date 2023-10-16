import { AmountShape } from '@agoric/ertp';
import { prepareExo, M, makeScalarBigMapStore } from '@agoric/vat-data';
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
  assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

  const { makeRecorderKit } = prepareRecorderKitMakers(baggage, marshaller);
  const {
    recorderKit: { subscriber, recorder },
  } = await provideAll(baggage, {
    recorderKit: () => makeRecorderKit(storageNode),
  });

  const buildDurableStorage = (keyword) => {
    let map;
    if (!baggage.has(keyword)) {
      map = makeScalarBigMapStore(keyword, { durable: true });
      baggage.init(keyword, map);
    } else {
      map = baggage.get(keyword);
    }
    return map;
  };

  const sellSeatsMap = buildDurableStorage('sellSeats');
  const buySeatsMap = buildDurableStorage('buySeats');

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

  const getOrderBook = () => ({
    buys: getOffers(buySeatsMap),
    sells: getOffers(sellSeatsMap),
  });

  const updateOrderBook = () => recorder.write(getOrderBook());
  updateOrderBook();

  const satisfiedBy = (xSeat, ySeat) =>
    satisfies(zcf, xSeat, ySeat.getCurrentAllocation());

  const swapIfCanTrade = (seatsMap, userSeat) => {
    for (const seat of seatsMap.keys()) {
      if (satisfiedBy(seat, userSeat) && satisfiedBy(userSeat, seat)) {
        swap(zcf, userSeat, seat);
        return seat;
      }
    }
    return undefined;
  };

  const swapIfCanTradeAndUpdateBook = (counterOffers, coOffers, userSeat) => {
    const seat = swapIfCanTrade(counterOffers, userSeat);
    if (seat) {
      counterOffers = counterOffers.delete(seat);
    } else {
      coOffers.init(userSeat, userSeat.getProposal());
    }
    updateOrderBook();
  };

  const exchangeOfferHandler = (seat) => {
    const { want, give } = seat.getProposal();

    if (want.Asset) {
      swapIfCanTradeAndUpdateBook(sellSeatsMap, buySeatsMap, seat);
      return 'Order Added';
    } else if (give.Asset) {
      swapIfCanTradeAndUpdateBook(buySeatsMap, sellSeatsMap, seat);
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

  const creatorFacet = prepareExo(
    baggage,
    'creatorFacet',
    M.interface('creatorFacetI', {}),
    {},
  );

  return harden({ creatorFacet, publicFacet });
};
harden(prepare);
export { prepare };
