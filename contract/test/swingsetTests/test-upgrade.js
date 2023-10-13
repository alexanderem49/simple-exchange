import { test } from '../prepare-test-env-ava.js';
import { buildVatController } from '@agoric/swingset-vat';
import { resolve as importMetaResolve } from 'import-meta-resolve';

const SIMPLE_EXCHANGE_V1 = '../../src/upgradableSimpleExchange.js';

const bfile = (name) => new URL(name, import.meta.url).pathname;

const modulePath = async (sourceRoot) => {
  const url = await importMetaResolve(sourceRoot, import.meta.url);
  return new URL(url).pathname;
};

const run = async (c, name, args = []) => {
  assert(Array.isArray(args));

  const kpid = c.queueToVatRoot('bootstrap', name, args);
  await c.run();
  const status = c.kpStatus(kpid);
  const capdata = c.kpResolution(kpid);
  return [status, capdata];
};

test.beforeEach(async (t) => {
  /** @type {SwingSetConfig} */
  const config = {
    defaultManagerType: 'local',
    includeDevDependencies: true,
    bootstrap: 'bootstrap',
    vats: {
      bootstrap: {
        sourceSpec: bfile('bootstrap-upgradable.js'),
      },
      zoe: {
        sourceSpec: await modulePath('@agoric/vats/src/vat-zoe.js'),
      },
      agoricNames: {
        sourceSpec: await modulePath('@agoric/vats/src/vat-agoricNames.js'),
      },
    },
    bundles: {
      zcf: {
        sourceSpec: await modulePath(
          '@agoric/zoe/src/contractFacet/vatRoot.js',
        ),
      },
      simple_exchange_v1: {
        sourceSpec: bfile(SIMPLE_EXCHANGE_V1),
      },
    },
  };

  t.log('buildVatController');
  const c = await buildVatController(config);

  c.pinVatRoot('bootstrap');

  t.context = {
    config,
    controller: c,
  };
});

test('initial', async (t) => {
  t.log({
    bfile: bfile(SIMPLE_EXCHANGE_V1),
    bootstrap: bfile('bootstrap-upgradable.js'),
    zoe: await modulePath('@agoric/vats/src/vat-zoe.js'),
    zcf: await modulePath('@agoric/zoe/src/contractFacet/vatRoot.js'),
  });
  t.pass('This is a dummy test');
});

test('null-upgrade', async (t) => {
  const { controller } = t.context;

  t.log('run controller');
  await controller.run();

  const [upgrade] = await run(controller, 'upgrade', ['simple_exchange_v1']);
  t.is(upgrade, 'fulfilled');
});

test('null-upgrade-orderBook', async (t) => {
  const { controller } = t.context;

  t.log('run controller');
  await controller.run();

  const [assertOrderBook] = await run(controller, 'assertOrderBook', [[], []]);
  t.is(assertOrderBook, 'fulfilled');

  const [addSellOffer] = await run(controller, 'addSellOffer', []);
  t.is(addSellOffer, 'fulfilled');

  let [assertOrderBookLength] = await run(
    controller,
    'assertOrderBookLength',
    [0, 1],
  );
  t.is(assertOrderBookLength, 'fulfilled');

  const [upgrade] = await run(controller, 'upgrade', ['simple_exchange_v1']);
  t.is(upgrade, 'fulfilled');

  [assertOrderBookLength] = await run(
    controller,
    'assertOrderBookLength',
    [0, 1],
  );
  t.is(assertOrderBookLength, 'fulfilled');
});

test.only('null-upgrade-trade', async (t) => {
  const { controller } = t.context;

  t.log('run controller');
  await controller.run();

  const [addSellOffer] = await run(controller, 'addSellOffer', []);
  t.is(addSellOffer, 'fulfilled');

  const [upgrade] = await run(controller, 'upgrade', ['simple_exchange_v1']);
  t.is(upgrade, 'fulfilled');

  let [assertOrderBookLength] = await run(
    controller,
    'assertOrderBookLength',
    [0, 1],
  );
  t.is(assertOrderBookLength, 'fulfilled');

  const [addBuyOffer] = await run(controller, 'addBuyOffer', []);
  t.is(addBuyOffer, 'fulfilled');

  let [assertOrderBookLength1] = await run(
    controller,
    'assertOrderBookLength',
    [0, 0],
  );
  t.is(assertOrderBookLength1, 'fulfilled');
});
