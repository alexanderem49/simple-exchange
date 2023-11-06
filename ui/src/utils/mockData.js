export const vbankAssets = [
  [
    'asset1',
    {
      brand: { type: 'something', value: 'somevalue' },
      displayInfo: { assetKind: 'nat', decimalPlaces: 2 }
    }
  ],
  [
    'asset2',
    {
      brand: { type: 'anotherType', value: 'anotherValue' },
      displayInfo: { assetKind: 'set', decimalPlaces: 0 }
    }
  ]
];

export const mockAmount = {
  brand: { name: 'asset1' },
  value: 100
};

export const mockBrands = {
  ATOM: {
    assetKind: 'nat',
    decimalPlaces: 2
  },
  IST: {
    assetKind: 'nat',
    decimalPlaces: 2
  }
};
