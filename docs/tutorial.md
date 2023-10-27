# SimpleExchange dApp tutorial

## Introduction

This tutorial showcases the dependencies of the simpleExchange contract, the multiple tests that can be done and how to do it, how to build and submit a core-eval on Agoric Devnet, and lastly, how to launch the dApp frontend.

## Index

- Pre-requisites
- Contract Testing
  - Unit tests
  - Integration tests
  - Smoke tests
  - Swingset tests
- Contract Deployment
- Launch UI

# Pre-requisites

- Follow the [installing the Agoric SDK](https://docs.agoric.com/guides/getting-started/) guide to install the Agoric Software Development Kit (SDK);
  - Important: instead of using the community-dev branch, you need to check out to the following revision: `92b6cd72484079b0349d8ccfa4510aeb820e8d67`
- Clone the [simpleExchange repository](https://github.com/alexanderem49/simple-exchange) and run `agoric install` in the project root directory;

```bash
go version # go version go1.20.6 darwin/arm64
node --version # v18.18.0
npm --version # 9.8.1
yarn --version # 1.22.5

# inside agoric-sdk folder
`git checkout 92b6cd72484079b0349d8ccfa4510aeb820e8d67`
yarn install && yarn build
agoric --version # 0.21.2-u11.0
```

# Contract Testing

## Unit tests

We use ava as a testing framework and Agoric SDK methods to set up and interact with smart contracts.

We covered most important cases in unit tests, making sure that the exchange contract works as expected, including sucsessful and failing branches. On successful branches we also check that assets are transferred properly to respective accounts and that amounts of assets transferred is correct.

We include 2 versions of unit tests:
- `./contract/test/unitTests/test-simpleExchange.js`
- `./contract/test/unitTests/test-upgradableSimpleExchange.js`

Both of these files cover durable and non-durable contract versions. Both of them contain exact same test cases, but each of them reflects the difference when deploying, configuring and communicating with the durable and non-durable contract versions.

Unit tests include following test cases:
- make sell offer - check that contract properly handles incoming sell offer
- make buy offer - check that contract properly handles incoming buy offer
- make trade - check that contract properly executes the trade when sell and buy offer can satisfy each other
- make offer with wrong issuers - check that offer with wrong issuer fails
- make offer with offerProposal missing attribute - check that offer with wrong offerProposal attributes fails
- make offer without offerProposal - check that offer without offerProposal fails
- offers with null or invalid shapes on the proposals - check with different invalid shapes set that each of them fails
- make offer with NFT - check that NFTs can be traded on the exchange properly

In order to run unit tests, just run the following command:
```shell
yarn unit-test
```
This will run tests for both durable and non-durable contract versions. You will see a lot of debug console logs from Agoric SDK, including some errors - these errors are triggered by unit tests to assert the failing branches. In total 16 unit tests should pass.

## Integration tests

The integration test is setting up an enviroment with separate smart wallets and checks that exchange contract can execute a successful trade.

The integration test includes only one test case:
- make trade - executes trade successfully

In order to run unit tests, just run the following command:
```shell
yarn integration-test
```

## Smoke tests

#### Launch local chain and client

> % cd agoric-sdk/packages/inter-protocol/scripts  
> % ./start-local-chain.sh

> % cd agoric-sdk/packages/cosmic-swingset  
> % make SOLO_COINS='13000000ubld,12345000000000uist,1122000000ibc/toyusdc' scenario2-run-client

#### Submit core-eval

> % cd simple-exchange/  
> % make build-proposal

Note: your terminal will print a message similar to the one bellow, make sure to copy the bundle IDs (`b1-265...e54.json` and `b1-60f...509.json`) and update the Makefile variables `CONTRACT_REF_BUNDLE_ID` and `MANIFEST_REF_BUNDLE_ID` respectively. 

```
jorgelopes@Jorges-MBP my-simple-exchange % make build-proposal
rm -rf /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/*
/Users/jorgelopes/Documents/GitHub/Agoric/agoric-sdk/packages/agoric-cli/bin/agoric run /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: running /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: Deploy script will run with Node.js ESM
creating startSimpleExchange-permit.json
creating startSimpleExchange.js
You can now run a governance submission command like:
  agd tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
    --title="Enable <something>" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
    --gas=auto --gas-adjustment=1.2
Remember to install bundles before submitting the proposal:
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-2650f4c0249bec056ff83866ab0d5aae340e29781ef5544941c1e7f1586b1bbf57c791022ff3c9d9be0d88a9b0dc9884d3fc8fa209c505d085a1117596f52e54.json
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-60fe5d5e379113b78f3cfd5a00ff13a25d36e5c6e63c9fecaf9d586f834d8d6d53259bfe499876e3b8fc84d85e02da7e345bf6344868bb2135a69a2d81c70509.json
```

> % make submit-core-eval

#### Run smoke tests

> % cd simple-exchange/contract/test/smokeTests/  
> % agoric deploy updateAssetList  
> % agoric deploy updateReferenceList  

> % ./sellOffer  
> % ./buyOffer

Note: the sell and buy `offerId` index is set to 0. If you wish to execute any of the scripts multiple times, remember to set the `SELL_INDEX` and/or `BUY_INDEX` to the respective incremental value, for example `export SELL_INDEX=1`

#### Verify order book

1. Agoric Wallet REPL
    - get instance from agoricNames
    - get publicFacet
    - get subscriber
    - get updated state

2. Storage Viewer
    - load published children keys
    - load simpleExchange data


## Swingset tests

In order to run Swingset tests, just run the following command:
```shell
yarn swingset-test
```

# Contract Deployment

For this task, we are going to use the following documents

- simpleExchange-proposal: this module consists of one or more BootBehavior functions that take a powers argument, and one function to get a BootstrapManifest that refers to all the BootBehaviors, along with a BootstrapManifestPermit for each.  
- proposalBuilder-script: script that imports the ProposalBuilder that refer to the function from the proposal to get a manifest. This module exports a DeployScriptFunction to call writeCoreProposal for the ProposalBuilder.
- Makefile: a list of targets that facilitate the process of deploying the contract on local chain or devnet.

1. Open a new terminal and run the following commands to create the contract and manifest bundles, as well as the core proposal and permit files

```shell
cd simpleExchange
make build-proposal
```

It should print something similar to this:

```
jorgelopes@Jorges-MBP my-simple-exchange % make build-proposal
rm -rf /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/*
/Users/jorgelopes/Documents/GitHub/Agoric/agoric-sdk/packages/agoric-cli/bin/agoric run /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: running /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: Deploy script will run with Node.js ESM
creating startSimpleExchange-permit.json
creating startSimpleExchange.js
You can now run a governance submission command like:
  agd tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
    --title="Enable <something>" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
    --gas=auto --gas-adjustment=1.2
Remember to install bundles before submitting the proposal:
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-2650f4c0249bec056ff83866ab0d5aae340e29781ef5544941c1e7f1586b1bbf57c791022ff3c9d9be0d88a9b0dc9884d3fc8fa209c505d085a1117596f52e54.json
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-60fe5d5e379113b78f3cfd5a00ff13a25d36e5c6e63c9fecaf9d586f834d8d6d53259bfe499876e3b8fc84d85e02da7e345bf6344868bb2135a69a2d81c70509.json
```

Note: make sure to copy the bundle IDs (`b1-265...e54.json` and `b1-60f...509.json`) and update the Makefile variables `CONTRACT_REF_BUNDLE_ID` and `MANIFEST_REF_BUNDLE_ID` respectively.

2. To install the bundles follow these instructions in the same terminal as above

Note: assure that you have an Agoric account on devnet provisioned with enough IST.  
Use the [devnet faucet](https://devnet.faucet.agoric.net/) to get more funds.

Update the

```shell
make install-contract-bundle-dev
make install-manifest-bundle-dev
```

If you wish to analyze the costs associated with your deployments, see the [Agoric Bundle Explorer](https://github.com/Agoric/agoric-sdk/discussions/8416)

3. Submit proposal

```shell
make submit-proposal-dev
```

4. Vote on proposal

In order to deploy a contract on devnet, the proposal needs to pass the voting stage. So it is advised to inform the community on the devnet channel on [Agoric discord](todo) in advance, that you plan to submit a proposal, so they can vote on it.

## Get proposal approved

# Launch UI

1. Update the RPC address and chain ID accordingly to where the contract was deployed.

At the `ui/src/store/store.js` file, line 5, update the `rpcAddr` and `chainId` passed to the `makeAgoricChainStorageWatcher`.  
If you wish to run the application on:

- local chain - `('http://localhost:26657', 'agoriclocal')`
- devnet - `('https://devnet.rpc.agoric.net:443', 'agoricdev-23')`

2. To lauch the dApp frontend, open a new terminal and run the following commands

```shell
cd ui
yarn
yarn run dev
```

Then open your browser and go to http://localhost:5173/#trade
