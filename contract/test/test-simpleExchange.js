// @ts-check

/* eslint-disable import/order -- https://github.com/endojs/endo/issues/1235 */
import { test } from './prepare-test-env-ava.js';
import path from 'path';
import bundleSource from '@endo/bundle-source';
import { E } from '@endo/eventual-send';
import { setUpZoeForTest } from '@agoric/inter-protocol/test/supports.js';
import { makeIssuerKit, AmountMath } from '@agoric/ertp';

const setupSimpleExchange = async (zoe) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../src/simpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  return { contractInstallation };
};

test.beforeEach(async (t) => {
  const { zoe } = await setUpZoeForTest(() => {});
  const { contractInstallation } = await setupSimpleExchange(zoe);

  const moolaKit = makeIssuerKit('moola');
  const simoleanKit = makeIssuerKit('simoleans');

  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);

  t.context = {
    zoe,
    contractInstallation,
    moolaKit,
    simoleanKit,
    moola: makeSimpleMake(moolaKit.brand),
    simoleans: makeSimpleMake(simoleanKit.brand),
  };
});

test('make sell offer', async (t) => {
  // @ts-ignore
  const { zoe, contractInstallation, moolaKit, simoleanKit, moola, simoleans } =
    t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  let offerResult = await E(aliceSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  const aliceNotifier = await E(publicFacet).getNotifier();
  let {
    value: { buys, sells },
  } = await E(aliceNotifier).getUpdateSince();

  t.deepEqual(buys, [], 'buys list should be empty');
  t.deepEqual(
    sells,
    [aliceSellOrderProposal],
    'sells list should NOT be empty',
  );
});

test('make buy offer', async (t) => {
  // @ts-ignore
  const { zoe, contractInstallation, moolaKit, simoleanKit, moola, simoleans } =
    t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const aliceSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const alicePayments = { Price: aliceSimoleansPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceBuyOrderProposal,
    alicePayments,
  );

  let offerResult = await E(aliceSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  const aliceNotifier = await E(publicFacet).getNotifier();
  let {
    value: { buys, sells },
  } = await E(aliceNotifier).getUpdateSince();

  t.deepEqual(sells, [], 'sells list should be empty');
  t.deepEqual(buys, [aliceBuyOrderProposal], 'buys list should NOT be empty');
});

test.only('make trade', async (t) => {
  // @ts-ignore
  const { zoe, contractInstallation, moolaKit, simoleanKit, moola, simoleans } =
    t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  console.log('LOG ...');
  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  await E(bobSeat).getOfferResult();

  const alicePayment = await E(aliceSeat).getPayouts();
  console.log(alicePayment);

  const bobPayment = await E(bobSeat).getPayouts();
  console.log(bobPayment);
  t.pass();
});
