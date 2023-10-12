import { E, Far } from '@endo/far';
import { makeFakeMarshaller } from '@agoric/notifier/tools/testSupports.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';
import { makeFakeAva } from '../tools/fakeAva.js';

const init = async () => {
  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = Far('fake marshaller', { ...makeFakeMarshaller() });

  const fakeAva = makeFakeAva();

  return harden({ storageNode, marshaller, fakeAva });
};

const initSimpleExchange = async (
  zoe,
  installation,
  issuerKeywordRecord,
  privateArgs,
) => {
  return await E(zoe).startInstance(
    installation,
    issuerKeywordRecord,
    undefined,
    privateArgs,
  );
};

const dummyEventLoopCallback = async () => {
  return Promise.resolve('Dummy iterate event loop');
};

export const buildRootObject = async () => {
  let vatAdmin;
  let zoe;
  let agoricNames;
  let agoricNamesAdmin;
  let publicFacet;
  let creatorFacet;

  const { storageNode, marshaller, fakeAva } = init();

  /**
   * Since 'eventLoopIteration' is not allowed in SwingSet we need a deterministic way to verify if the recorderKit is done
   * publishing new state before we assert our operations succeeded or not.
   * This method tries waiting for the `lastUpdateCount` increment after any performed operation we wish to test.
   */
  const refreshLastUpdateCount = async (subscriber) => {
    ({ updateCount: lastUpdateCount } = await E(subscriber).getUpdateSince());
    console.log({
      lastUpdateCount,
    });
  };

  return Far('root', {
    bootstrap: async (vats, devices) => {
      // Initialize static vats
      vatAdmin = await E(vats.vatAdmin).createVatAdminService(devices.vatAdmin);
      ({ zoeService: zoe } = await E(vats.zoe).buildZoe(
        vatAdmin,
        undefined,
        'zcf',
      ));
      ({ nameHub: agoricNames, nameAdmin: agoricNamesAdmin } = await E(
        vats.agoricNames,
      ).getNameHubKit());

      const [simpleExchangeV1Bundle, issuerHubKit, brandHubKit] =
        await Promise.all([
          E(vatAdmin).getBundleIDByName('simpleExchange_v1'),
          E(agoricNamesAdmin).provideChild('issuer'),
          E(agoricNamesAdmin).provideChild('brand'),
        ]);

      console.log({
        issuerHubKit,
        brandHubKit,
      });

      const writes = [...Object.values(assets)].map(async (value) => {
        const name = value.issuer.getAllegedName();
        await Promise.all([
          E(issuerHubKit.nameAdmin).update(name, value.issuer),
          E(brandHubKit.nameAdmin).update(name, value.brand),
        ]);
      });
    },
  });
};
