# Simple Exchange dapp (WiP)

## Description
The exchange contract was written with simplicity in mind. It allows the exchange of two predefined assets, and it holds an order book which is filled when users make an offer, describing what asset they give and what asset they want in return. As soon as a user creates an offer that matches one of the existing offers, the contract will execute the exchange and the counterparts will receive their desired assets.

## Content

- Contracts:
  - Non-upgradable version
  - Upgradable version
- Tests:
  - Unit tests (both versions)
     - testing helpers
  - Integration tests
  - Swingset tests (upgradable version)
  - Smoke tests
- Core-eval proposals
