# SimpleExchange dApp 

## Description
The SimpleExchange contract was written with simplicity in mind. It allows the exchange of two predefined assets, and it holds an order book which is filled when users make an offer, describing what asset they give and what asset they want in return. As soon as a user creates an offer that matches one of the existing ones, the contract will execute the exchange and the counterparts will receive their desired assets.

## Documentation
You can find a detailed description of the SimpleExchange contract in the [components page](./docs/component.md), as well as a guide on how to interact, test and deploy the contract in the [tutorial page](./docs/tutorial.md).  
For the contracts and tests we included in-line comments to facilitate the understatement of the logic implemented and methods used.

## Repository Contents

- Contracts:
  - Basic version
  - Upgradable version
- Tests:
  - Unit tests (both versions)
  - Integration tests
  - Swingset tests
  - Smoke tests
  - testing helpers
- Core-eval proposals
- Documentation
  - Component
  - Tutorial
- UI

## Community
Any feedback is welcome, so feel free to share your ideas or improvements, by opening an issue or pull request.
