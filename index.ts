import axios from 'axios';
import fs from 'fs';

type Chain = {
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

type ExtraChainData = {
  [chainId in string]: Chain;
};

const readFileSync = <T>(path: string): T =>
  JSON.parse(fs.readFileSync(path, 'utf8')) as T;

const writeFileSync = (path: string, data: any): void =>
  fs.writeFileSync(path, JSON.stringify(data));

const get = async <T>(url: string): Promise<T> => {
  const response = await axios.get(url);
  if (response.status != 200) {
    throw new Error(`Error fetching ${url}`);
  }
  return response.data;
};

const removeTrailingSlash = (rpc: string) => {
  return rpc.endsWith('/') ? rpc.substring(0, rpc.length - 1) : rpc;
};

const rpcFilter = (rpc: string[]): string[] => {
  return rpc
    .map(removeTrailingSlash)
    .filter((rpc) => !rpc.includes('${INFURA_API_KEY}'))
    .filter((rpc) => !rpc.includes('${ALCHEMY_API_KEY}'))
    .filter((rpc) => !rpc.includes('${API_KEY}'))
    .filter((rpc) => !rpc.includes('wss://'))
    .filter((rpc) => !rpc.includes('ws://'));
};

const overloadChainData = (chain: Chain, ecd: Chain): Chain => {
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

(async () => {
  // Read current scan-apis json
  const extraChainsData = readFileSync<ExtraChainData>('extra-chain-data.json');

  const parseChain = (chain: Chain): Chain => {
    if (chain.chainId.toString() in extraChainsData) {
      chain = overloadChainData(
        chain,
        extraChainsData[chain.chainId.toString()]
      );
    }

    return {
      ...chain,
      rpc: Array.from(new Set(rpcFilter(chain.rpc))),
    };
  };

  // Fetch new chainlist json
  const newChainlist = (
    await get<Chain[]>('https://chainid.network/chains.json')
  ).map(parseChain);

  // Read current chainlist json
  let currentChainlist = readFileSync<Chain[]>('chain-list.json');

  // Check for new chains
  const newChains = newChainlist.filter(
    (c) => !currentChainlist.some((cc) => cc.chainId === c.chainId)
  );
  if (newChains.length) {
    console.log(`Found ${newChains.length} new chains`);
    currentChainlist = [...currentChainlist, ...newChains];
  }

  // Check for removed chains
  const removedChains = currentChainlist.filter(
    (c) => !newChainlist.some((cc) => cc.chainId === c.chainId)
  );
  if (removedChains.length) {
    console.log(`Found ${removedChains.length} removed chains`);
    currentChainlist = currentChainlist.filter(
      (c) => !removedChains.some((cc) => cc.chainId === c.chainId)
    );
  }

  // Check chains with diffs
  currentChainlist.map((chain: Chain, i: number) => {
    const newChain = newChainlist.find((c) => c.chainId === chain.chainId);
    if (newChain) {
      if (JSON.stringify(newChain) != JSON.stringify(chain)) {
        currentChainlist[i] = newChain;
      }
    }
  });

  writeFileSync('chain-list.json', [...currentChainlist]);
})();
