import axios from 'axios';
import fs from 'fs';
import { ASSETS_BLOCKCHAINS_CHAIN_ID, ASSETS_LIST_PATH } from './constants';
import { Chain } from './types';

export const readFileSync = <T>(path: string): T =>
  JSON.parse(fs.readFileSync(path, 'utf8')) as T;

export const writeFileSync = (path: string, data: any): void =>
  fs.writeFileSync(path, JSON.stringify(data));

export const get = async <T>(url: string): Promise<T> => {
  const response = await axios.get(url);
  if (response.status != 200) {
    throw new Error(`Error fetching ${url}`);
  }
  return response.data;
};

export const removeTrailingSlash = (rpc: string) => {
  return rpc.endsWith('/') ? rpc.substring(0, rpc.length - 1) : rpc;
};

export const rpcFilter = (rpc: string[]): string[] => {
  return rpc
    .map(removeTrailingSlash)
    .filter((rpc) => !rpc.includes('${INFURA_API_KEY}'))
    .filter((rpc) => !rpc.includes('${ALCHEMY_API_KEY}'))
    .filter((rpc) => !rpc.includes('${API_KEY}'))
    .filter((rpc) => !rpc.includes('wss://'))
    .filter((rpc) => !rpc.includes('ws://'));
};

export const overloadhainLogoWithAssetsRepository = (chain: Chain): Chain => {
  if (chain.chainId in ASSETS_BLOCKCHAINS_CHAIN_ID) {
    chain.logo = `https://raw.githubusercontent.com/block-wallet/assets/master/blockchains/${
      ASSETS_BLOCKCHAINS_CHAIN_ID[chain.chainId]
    }/info/logo.png`;
  }

  return chain;
};

export const overloadChainData = (chain: Chain, ecd: Chain): Chain => {
  if (ecd.name) chain.name = ecd.name;
  if (ecd.chain) chain.chain = ecd.chain;
  if (ecd.icon) chain.icon = ecd.icon;
  if (ecd.rpc && ecd.rpc.length)
    if (chain.rpc && chain.rpc.length)
      chain.rpc = Array.from(new Set([...chain.rpc, ...ecd.rpc]));
    else chain.rpc = ecd.rpc;
  if (ecd.faucets && ecd.faucets.length)
    if (chain.faucets && chain.faucets.length)
      chain.faucets = Array.from(new Set([...chain.faucets, ...ecd.faucets]));
    else chain.faucets = ecd.faucets;
  if (ecd.nativeCurrency) chain.nativeCurrency = ecd.nativeCurrency;
  if (ecd.nativeCurrencyIcon) chain.nativeCurrencyIcon = ecd.nativeCurrencyIcon;
  if (ecd.infoURL) chain.infoURL = ecd.infoURL;
  if (ecd.shortName) chain.shortName = ecd.shortName;
  if (ecd.chainId) chain.chainId = ecd.chainId;
  if (ecd.networkId) chain.networkId = ecd.networkId;
  if (ecd.slip44) chain.slip44 = ecd.slip44;
  if (ecd.ens) chain.ens = ecd.ens;
  if (ecd.logo) chain.logo = ecd.logo;
  if (ecd.explorers && ecd.explorers.length)
    if (chain.explorers && chain.explorers.length)
      chain.explorers = Array.from(
        new Set([...chain.explorers, ...ecd.explorers])
      );
    else chain.explorers = ecd.explorers;
  if (ecd.scanApi) chain.scanApi = ecd.scanApi;

  return chain;
};
