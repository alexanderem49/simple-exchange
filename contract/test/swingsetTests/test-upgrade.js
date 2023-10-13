import { test } from '../prepare-test-env-ava.js';
import { buildVatController } from '@agoric/swingset-vat';
import { resolve as importMetaResolve } from 'import-meta-resolve';

const SIMPLE_EXCHANGE_V1 = '../../src/upgradableSimpleExchange.js';

const bfile = (name) => new URL(name, import.meta.url).pathname;

const modulePath = async (sourceRoot) => {
  const url = await importMetaResolve(sourceRoot, import.meta.url);
  return new URL(url).pathname;
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

test.only('crabble-null-upgrade', async (t) => {
  const { controller } = t.context;

  t.log('run controller');
  await controller.run();

  t.pass();
});
