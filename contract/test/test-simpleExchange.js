import { test } from './prepare-test-env-ava.js';
import { E } from '@endo/eventual-send';
import { setUpZoeForTest } from '@agoric/inter-protocol/test/supports.js';
import { AmountMath, AssetKind, makeIssuerKit } from '@agoric/ertp';
import { makeSimpleExchangeAssertions } from './tools/assertions.js';
import { makeSimpleExchangeHelpers } from './tools/helpers.js';
import { setupSimpleExchange, setupAssets } from './tools/setup.js';

test.beforeEach(async (t) => {
  const { zoe } = await setUpZoeForTest(() => { });
  const assets = setupAssets();

  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);
  const moola = makeSimpleMake(assets.moolaKit.brand);
  const simoleans = makeSimpleMake(assets.simoleanKit.brand);
  const nothing = makeSimpleMake(assets.nothingKit.brand);

  t.context = {
    zoe,
    assets,
    moola,
    simoleans,
    nothing,
  };
});

test('make sell offer', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const invitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    3n,
    4n,
  );

  const seat = await E(zoe).offer(
    invitation,
    sellOrderProposal,
    sellPayment,
  );

  const offerResult = await E(seat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);
});

test('make buy offer', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const invitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
    assets,
    3n,
    4n,
  );

  const seat = await E(zoe).offer(
    invitation,
    buyOrderProposal,
    buyPayment
  );

  const offerResult = await E(seat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  expectedBuys = [buyOrderProposal];
  expectedSells = [];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);
});

test('make trade', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const moolaValue = 3n;
  const simoleanValue = 4n;

  // Alice makes a sell offer
  const aliceInvitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    moolaValue,
    simoleanValue,
  );

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    sellOrderProposal,
    sellPayment,
  );

  const offerResult = await E(aliceSeat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  // Bob makes a buy offer
  const bobInvitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
    assets,
    moolaValue,
    simoleanValue,
  );

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    buyOrderProposal,
    buyPayment,
  );

  const bobOfferResult = await E(bobSeat).getOfferResult();
  assertions.assertOfferResult(bobOfferResult, 'Order Added');

  // As the trade is made, the order book should be cleared
  expectedBuys = [];
  expectedSells = [];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  // Asset assets are swapped
  const bobPayout = await E(bobSeat).getPayout('Asset');
  const alicePayout = await E(aliceSeat).getPayout('Price');

  const amountMoola = await E(moolaKit.issuer).getAmountOf(bobPayout);
  const amountSimolean = await E(simoleanKit.issuer).getAmountOf(alicePayout);

  assertions.assertPayoutAmount(amountMoola.value, moolaValue);
  assertions.assertPayoutAmount(amountSimolean.value, simoleanValue);
});

test('make offer with wrong issuers', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit, nothingKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  assertions.assertNotIssuer(issuers.Asset, nothingKit.issuer);
  assertions.assertNotIssuer(issuers.Price, nothingKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  let invitation = await E(publicFacet).makeInvitation();
  let { sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidSellOffer(
    assets,
    3n,
    4n,
    "wrongWantIssuer"
  );

  let seatPromise = E(zoe).offer(
    invitation,
    sellOrderProposal,
    sellPayment,
  );

  await assertions.assertThrowError(seatPromise, expectedError);

  invitation = await E(publicFacet).makeInvitation();
  ({ sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidSellOffer(
    assets,
    3n,
    4n,
    "wrongGiveIssuer"
  ));

  seatPromise = E(zoe).offer(
    invitation,
    sellOrderProposal,
    sellPayment,
  );

  await assertions.assertThrowError(seatPromise, expectedError);
});

test('make offer with offerProposal missing attribute', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  let invitation = await E(publicFacet).makeInvitation();
  let { sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidSellOffer(
    assets,
    3n,
    4n,
    "missingWant"
  );
  let seatPromise = E(zoe).offer(
    invitation,
    sellOrderProposal,
    sellPayment,
  );

  await assertions.assertThrowError(seatPromise, expectedError);

  invitation = await E(publicFacet).makeInvitation();
  ({ sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidSellOffer(
    assets,
    3n,
    4n,
    "missingGive"
  ));
  seatPromise = E(zoe).offer(
    invitation,
    sellOrderProposal,
    sellPayment,
  );

  await assertions.assertThrowError(seatPromise, expectedError);
});

test('make offer without offerProposal', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const invitation = await E(publicFacet).makeInvitation();

  const seatPromise = E(zoe).offer(
    invitation,
    undefined,
    undefined,
  );

  await assertions.assertThrowError(seatPromise, '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]');
});

test('offers with null or invalid shapes on the proposals', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  const { publicFacet, instance } = await setupSimpleExchange(zoe, assets);

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const invalidShapes = helpers.makeInvalidSellOffer(
    assets,
    3n,
    4n,
    "invalidShapes"
  )

  const promises = invalidShapes.map(async ({ sellOrderProposal, sellPayment, expectedError }) => {
    const invitation = await E(publicFacet).makeInvitation();
    const seatPromise = E(zoe).offer(
      invitation,
      sellOrderProposal,
      sellPayment,
    );

    await assertions.assertThrowError(seatPromise, expectedError);
  });

  await Promise.all(promises);
});

test('make offer with NFT', async (t) => {
  const { zoe, assets } = t.context;
  const { simoleanKit } = assets;

  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Make NFT kit
  const moolaKit = makeIssuerKit("Moola", AssetKind.SET);
  const { publicFacet, instance } = await setupSimpleExchange(zoe, { moolaKit, simoleanKit });

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const notifier = await E(publicFacet).getNotifier();
  let orderBook = await E(notifier).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  const moolaAttributes = { name: "Moola", description: "A set of moola" };
  const simoleanAmount = 4n;

  // Alice makes a sell offer
  const aliceInvitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOfferNFT(
    { moolaKit, simoleanKit },
    moolaAttributes,
    simoleanAmount,
  );

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    sellOrderProposal,
    sellPayment,
  );

  const aliceOfferResult = await E(aliceSeat).getOfferResult();
  assertions.assertOfferResult(aliceOfferResult, 'Order Added');

  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  // Bob makes a buy offer
  const bobInvitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOfferNFT(
    { moolaKit, simoleanKit },
    moolaAttributes,
    simoleanAmount,
  );

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    buyOrderProposal,
    buyPayment,
  );

  const bobOfferResult = await E(bobSeat).getOfferResult();
  assertions.assertOfferResult(bobOfferResult, 'Order Added');

  // As the trade is made, the order book should be cleared
  expectedBuys = [];
  expectedSells = [];
  orderBook = await E(notifier).getUpdateSince();
  assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);

  // Asset assets are swapped
  const bobPayout = await E(bobSeat).getPayout('Asset');
  const alicePayout = await E(aliceSeat).getPayout('Price');

  const amountMoola = await E(moolaKit.issuer).getAmountOf(bobPayout);
  const amountSimolean = await E(simoleanKit.issuer).getAmountOf(alicePayout);

  assertions.assertPayoutAmount(amountMoola.value, [moolaAttributes]);
  assertions.assertPayoutAmount(amountSimolean.value, simoleanAmount);
});