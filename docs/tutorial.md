# SimpleExchange dApp tutorial

## Introduction and objectives

This tutorial showcases how to test the simpleExchange contract, how to deploy it on the Agoric devnet, and lastly, how to launch its UI

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

# Contract Testing

## Unit tests

- brief description of testing tools
- brief description of tests made
- commands necessary to execute tests
  - list commands step by step
  - highlight the output with an example when appropriated

## Integration tests

- brief description of testing tools
- brief description of tests made
- commands necessary to execute tests
  - list commands step by step
  - highlight the output with an example when appropriated

## Smoke tests

- brief description of testing tools
- brief description of tests made
- commands necessary to execute tests
  - list commands step by step
  - highlight the output with an example when appropriated
- verify state using wallet repl, storage viewer and agd queries

## Swingset tests

- brief description of testing tools
- brief description of tests made
- commands necessary to execute tests
  - list commands step by step
  - highlight the output with an example when appropriated

# Contract Deployment

For this task, we are going to use the following docs

- simpleExchange-proposal: this module consists of one or more BootBehavior functions that take a powers argument,
  and one function to get a BootstrapManifest that refers to all the BootBehaviors, along with a BootstrapManifestPermit for each.
- proposalBuilder-script: script that imports the ProposalBuilder that refer to the function from the proposal to get a manifest.
  This module exports a DeployScriptFunction to call writeCoreProposal for the ProposalBuilder.
- Makefile: a list of targets that facilitate the process of deploying the contract on local chain or devnet

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

3. Submit proposal

```shell
make submit-proposal-dev
```

4. Vote on proposal

Inform the community on the devnet channel on Agoric discord that you plan to submit a proposal, so they can vote on it.

## Get proposal approved

# Launch UI

1. Update the RPC address and chain ID

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
