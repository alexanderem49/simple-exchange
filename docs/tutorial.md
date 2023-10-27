# Title

## Introduction and objectives

## Index

# Pre-requisites

- agoric-sdk
- simpleExchange
- ...

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

# Contract Deployment

## Build proposal

- proposalBuilder
- proposal script

### Make and install bundles

1. Run the following commands to create the contract and manifest bundles, as well as the core proposal and permit files

```shell
cd simpleExchange
make build-proposal
```

2. To install the bundles follow this instructions in the same terminal as above

Note: assure that you have an agoric account on devnet provisioned with enough IST.
Use the [devnet faucet](https://devnet.faucet.agoric.net/)

Update the 

```shell
make build-proposal

```

## Submit proposal

- makefile

## Get proposal approved

# Launch UI

```shell
cd ui
yarn
yarn run dev
```

Go to : http://localhost:5173/#trade

## Listen to local chain vs devnet

my-simple-exchange/ui/src/store/store.js
watcher: makeAgoricChainStorageWatcher('http://localhost:26657', 'agoriclocal'),

# Interact with dApp

## Submit offers
