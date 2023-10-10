import { test } from './prepare-test-env-ava.js';
import path from 'path';
import bundleSource from '@endo/bundle-source';
import { E, Far } from '@endo/far';
import { setUpZoeForTest } from '@agoric/inter-protocol/test/supports.js';
import { makeIssuerKit, AmountMath } from '@agoric/ertp';
import { makeFakeMarshaller } from '@agoric/notifier/tools/testSupports.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';

const setupUpgradableSimpleExchange = async (zoe) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../src/upgradableSimpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = Far('fake marshaller', { ...makeFakeMarshaller() });

  const privateArgs = harden({ marshaller, storageNode });

  return { contractInstallation, privateArgs };
};

test.beforeEach(async (t) => {
  const { zoe } = await setUpZoeForTest(() => {});
  const { contractInstallation, privateArgs } =
    await setupUpgradableSimpleExchange(zoe);

  const moolaKit = makeIssuerKit('moola');
  const simoleanKit = makeIssuerKit('simoleans');

  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);

  t.context = {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola: makeSimpleMake(moolaKit.brand),
    simoleans: makeSimpleMake(simoleanKit.brand),
  };
});

test('test empty subscriber', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const subscriber = await E(publicFacet).getSubscriber();
  const state = await E(subscriber).getUpdateSince();

  t.deepEqual(state.value, { buys: [], sells: [] });
});

test('test make sell offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
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

  const subscriber = await E(publicFacet).getSubscriber();
  const state = await E(subscriber).getUpdateSince();

  t.deepEqual(state.value, { buys: [], sells: [aliceSellOrderProposal] });
});

test('test make buy offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  let offerResult = await E(bobSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  const subscriber = await E(publicFacet).getSubscriber();
  const state = await E(subscriber).getUpdateSince();

  t.deepEqual(state.value, { buys: [bobBuyOrderProposal], sells: [] });
});

test.only('test make trade', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
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

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  await E(bobSeat).getOfferResult();

  const alicePayouts = await E(aliceSeat).getPayouts();

  const bobPayouts = await E(bobSeat).getPayouts();

  console.log(alicePayouts);
  console.log(bobPayouts);

  //ToDo:  get amouts for each payment and verify if it is according to the expected
  t.pass();
});
