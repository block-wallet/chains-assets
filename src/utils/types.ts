import { replaceAll } from './helpers';

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
  isTestnet: boolean;
};

export type ExtraChainData = {
  [chainId in string]: Chain;
};

export interface IToken {
  name: string;
  logo: string;
  type: string;
  symbol: string;
  decimals: number;
  l1Bridge?: {
    tokenAddress: string;
    bridgeAddress: string;
  };
}

export class Token implements IToken {
  name: string;
  logo: string;
  type: string;
  symbol: string;
  decimals: number;
  l1Bridge?: {
    tokenAddress: string;
    bridgeAddress: string;
  };

  constructor(token: IToken) {
    this.name = replaceAll(token.name, '"', '');
    this.logo = replaceAll(
      typeof token.logo === 'string'
        ? token.logo
        : 'src' in token.logo
        ? token.logo['src']
        : '',
      '"',
      ''
    );
    this.type = replaceAll(token.type, '"', '');
    this.symbol = replaceAll(token.symbol, '"', '');
    this.decimals = token.decimals;

    if (token.l1Bridge) {
      this.l1Bridge = {
        tokenAddress: replaceAll(token.l1Bridge.tokenAddress, '"', ''),
        bridgeAddress: replaceAll(token.l1Bridge.bridgeAddress, '"', ''),
      };
    }
  }

  public toJSON() {
    const json: any = {
      n: this.name,
      l: this.logo,
      t: this.type,
      s: this.symbol,
      de: this.decimals,
      l1: this.l1Bridge
        ? {
            t: this.l1Bridge.tokenAddress,
            b: this.l1Bridge.bridgeAddress,
          }
        : undefined,
    };

    const pattern =
      /https:\/\/raw\.githubusercontent\.com\/block-wallet\/assets\/master\/blockchains\/[a-zA-Z]+\/assets\/0x[a-fA-F0-9]{40}\/logo\.png/gm;
    if (pattern.test(this.logo)) {
      json['l'] = undefined;
    } else {
      json['l'] = json['l'].replace('https://', '');
    }

    switch (this.type) {
      case 'ERC20':
        json['t'] = 'E';
        break;
      case 'BEP20':
        json['t'] = 'B';
        break;
      case 'POLYGON':
        json['t'] = 'P';
        break;
      case 'FANTOM':
        json['t'] = 'F';
        break;
      case 'WAN20':
        json['t'] = 'W';
        break;
      case 'CELO':
        json['t'] = 'C';
        break;
      case 'AVALANCHE':
        json['t'] = 'A';
        break;
      case 'ETC20':
        json['t'] = 'ET';
        break;
      case 'TT20':
        json['t'] = 'T';
        break;
      case '':
        json['t'] = undefined;
        break;
    }

    return json;
  }
}
