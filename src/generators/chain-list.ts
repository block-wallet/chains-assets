import {
  ASSETS_BLOCKCHAINS_CHAIN_ID,
  ASSETS_RESOURCES_URL,
  CHAINS_DATASOURCE_URL,
  CHAIN_LIST_FILE,
  EXTRA_CHAIN_DATA_FILE,
} from '../utils/constants';
import {
  get,
  readFileSync,
  removeTrailingSlash,
  writeFileSync,
} from '../utils/helpers';
import { Chain, ExtraChainData } from '../utils/types';

const rpcFilter = (rpc: string[]): string[] => {
  return rpc
    .map(removeTrailingSlash)
    .filter((rpc) => !rpc.includes('${INFURA_API_KEY}'))
    .filter((rpc) => !rpc.includes('${ALCHEMY_API_KEY}'))
    .filter((rpc) => !rpc.includes('${API_KEY}'))
    .filter((rpc) => !rpc.includes('wss://'))
    .filter((rpc) => !rpc.includes('ws://'));
};

const overloadhainLogoWithAssetsRepository = (chain: Chain): Chain => {
  if (chain.chainId in ASSETS_BLOCKCHAINS_CHAIN_ID) {
    chain.logo = `${ASSETS_RESOURCES_URL}/${
      ASSETS_BLOCKCHAINS_CHAIN_ID[chain.chainId]
    }/info/logo.png`;
  }

  return chain;
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

export const generator = async () => {
  // Read current scan-apis json
  const extraChainsData = readFileSync<ExtraChainData>(EXTRA_CHAIN_DATA_FILE);

  const parseChain = (chain: Chain): Chain => {
    chain = overloadhainLogoWithAssetsRepository(chain);

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
  const newChainlist = (await get<Chain[]>(CHAINS_DATASOURCE_URL)).map(
    parseChain
  );

  // Read current chainlist json
  let currentChainlist = readFileSync<Chain[]>(CHAIN_LIST_FILE);

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
        console.log(`Found differences for ${chain.chainId} - ${chain.name}`);
        currentChainlist[i] = newChain;
      }
    }
  });

  writeFileSync(CHAIN_LIST_FILE, [...currentChainlist]);
};
