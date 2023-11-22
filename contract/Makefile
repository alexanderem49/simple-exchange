SDK_ROOT = $(shell cd ../../../agoric-sdk >/dev/null && pwd)
AGORIC = $(SDK_ROOT)/packages/agoric-cli/bin/agoric
AGD = $(SDK_ROOT)/bin/agd
LOCAL_CHAIN_ID = agoriclocal

DEV_CHAIN_ID = agoricdev-23
DEV_RPC = https://devnet.rpc.agoric.net:443
DEV_WALLET = gov

GAS = 40000000
GAS_ADJUSTMENT = 1.2
VOTE_PROPOSAL = 1
VOTE_OPTION = yes

PROPOSAL_BUILDER = ${shell pwd}/src/proposal/proposalBuilder-script.js
HOME = $(SDK_ROOT)/packages/cosmic-swingset/t1/bootstrap
LOCAL_WALLET = bootstrap

CONTRACT_REF_BUNDLE_ID = @cache/b1-180be6a3be174c957d853e862801c3643a2897ef3e96993507fe6a02ad57d33806754bf2bc73bb2664f8536861e42d46139971f9cc85724abed9408ba1b57e8a.json
MANIFEST_REF_BUNDLE_ID = @cache/b1-b2bb6209e466d1d7298523776513ce11c57c2eef47e52e050b5f40c2e056a03ae350c2328ad05b748ae8ee503e94c4b9ebf974aea3202643d0c7377bbe582aea.json


# ====================================================     Make Bundles   =================================================

bundle-contract:
	rm -rf ${shell pwd}/cache/*
	${AGORIC} run ${PROPOSAL_BUILDER}

# ====================================================     Local Chain Deployment    =================================================

install-contract-bundle:
	${AGD} tx swingset install-bundle ${CONTRACT_REF_BUNDLE_ID} \
		--from=${LOCAL_WALLET} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

install-manifest-bundle:
	${AGD} tx swingset install-bundle ${MANIFEST_REF_BUNDLE_ID} \
		--from=${LOCAL_WALLET} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

submit-proposal:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
		--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${LOCAL_WALLET} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

vote:
	$(AGD) tx gov vote $(VOTE_PROPOSAL) $(VOTE_OPTION) \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${LOCAL_WALLET} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

submit-core-eval: install-contract-bundle install-manifest-bundle submit-proposal vote


# ====================================================     Devnet Deployment    =================================================

install-contract-bundle-dev:
	${AGD} tx swingset install-bundle ${CONTRACT_REF_BUNDLE_ID} \
		--from=${DEV_WALLET} --node=$(DEV_RPC)  --chain-id=${DEV_CHAIN_ID} --gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) --yes -b block

install-manifest-bundle-dev:
	${AGD} tx swingset install-bundle ${MANIFEST_REF_BUNDLE_ID} \
		--from=${DEV_WALLET} --node=$(DEV_RPC)  --chain-id=${DEV_CHAIN_ID} --gas=auto --yes -b block

install-bundles-dev: install-contract-bundle-dev install-manifest-bundle-dev

submit-proposal-dev:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
		--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${DEV_WALLET} --node=$(DEV_RPC)  --chain-id=${DEV_CHAIN_ID} --yes -b block
