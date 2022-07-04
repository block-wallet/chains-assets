export type Chain = {
  name: string;
  chain: string;
  icon: string;
  rpc: string[];
  faucets: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  nativeCurrencyIcon: string;
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  slip44: number;
  ens: { registry: string };
  logo: string;
  explorers: {
    name: string;
    url: string;
    standard: string;
  }[];
  scanApi: string;
};

export type ExtraChainData = {
  [chainId in string]: Chain;
};
