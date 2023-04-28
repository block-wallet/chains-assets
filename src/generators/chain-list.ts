import {
  ASSETS_BLOCKCHAINS_CHAIN_ID,
  ASSETS_RESOURCES_URL,
  AUTO_GENERATED_FILE_LABEL,
  CHAINS_DATASOURCE_URL,
  CHAIN_LIST_FILE,
  EXTRA_CHAIN_DATA_FILE,
  NEW_CHAIN_DATA_FILE,
} from '../utils/constants';
import {
  get,
  readFileSync,
  removeTrailingSlash,
  replaceAll,
  writeFileStringSync,
  writeFileSync,
} from '../utils/helpers';
import { Chain, ExtraChainData, NewChainData } from '../utils/types';

const ONLY_HTTP_REGEX = new RegExp('^(http)://', 'i');

const rpcFilter = (rpc: string[]): string[] => {
  return rpc
    .map(removeTrailingSlash)
    .filter((rpc) => !rpc.includes('${INFURA_API_KEY}'))
    .filter((rpc) => !rpc.includes('${ALCHEMY_API_KEY}'))
    .filter((rpc) => !rpc.includes('${API_KEY}'))
    .filter((rpc) => !rpc.includes('wss://'))
    .filter((rpc) => !rpc.includes('ws://'))
    .filter((rpc) => rpc.match(ONLY_HTTP_REGEX) === null);
};

const overloadChainLogoWithAssetsRepository = (chain: Chain): Chain => {
  if (chain.chainId in ASSETS_BLOCKCHAINS_CHAIN_ID) {
    chain.logo = `${ASSETS_RESOURCES_URL}/${ASSETS_BLOCKCHAINS_CHAIN_ID[chain.chainId]
      }/info/logo.png`;
  }

  return chain;
};

const overloadIsTestnet = (chain: Chain): Chain => {
  if (!chain.isTestnet) {
    chain.isTestnet =
      !!chain.name.toLowerCase().match(/test/gi) ||
      !!chain.shortName.toLowerCase().match(/test/gi) ||
      (chain.rpc || []).some((rpcEndpoint) =>
        rpcEndpoint.toLowerCase().match(/test/gi)
      ) ||
      (chain.explorers || []).some((explorer) =>
        explorer.url.toLowerCase().match(/test/gi)
      );
  }

  return chain;
};

const overloadChainData = (chain: Chain, ecd: Chain): Chain => {
  if (ecd.name) chain.name = ecd.name;
  if (ecd.chain) chain.chain = ecd.chain;
  if (ecd.icon) chain.icon = ecd.icon;
  if (ecd.rpc && ecd.rpc.length)
    if (chain.rpc && chain.rpc.length)
      chain.rpc = Array.from(new Set([...ecd.rpc, ...chain.rpc]));
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
  if (ecd.isTestnet) chain.isTestnet = ecd.isTestnet;

  return chain;
};

export const generator = async () => {
  // Read current scan-apis json
  const extraChainsData = readFileSync<ExtraChainData>(EXTRA_CHAIN_DATA_FILE);
  const newChainsData = readFileSync<NewChainData>(NEW_CHAIN_DATA_FILE);

  const parseChain = (chain: Chain): Chain => {
    chain = overloadChainLogoWithAssetsRepository(chain);
    chain = overloadIsTestnet(chain);

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



  const addChains = (newChainsData: NewChainData, chainlist: Chain[]): Chain[] => {
    const newChains: Chain[] = []
    for (const chain in newChainsData) {
      if (!(chain in chainlist)) {
        newChains.push(newChainsData[chain])
      }
    }
    return newChains
  }

  // Fetch new chainlist json
  const chainlist = (await get<Chain[]>(CHAINS_DATASOURCE_URL)).map(parseChain);
  const newChains = addChains(newChainsData, chainlist)
  writeFileStringSync(
    CHAIN_LIST_FILE,
    `${AUTO_GENERATED_FILE_LABEL}

type ChainListItem = {
  name: string;
  chain: string;
  title?: string;
  icon?: string;
  logo?: string;
  rpc: string[];
  faucets: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  nativeCurrencyIcon?: string;
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  network?: string;
  isTestnet?: boolean;
  slip44?: number;
  ens?: { registry: string };
  scanApi?: string;
  explorers?: {
    name: string;
    url: string;
    standard: string;
    icon?: string;
  }[];
  parent?: {
    type: string;
    chain: string;
    bridges?: {
      url: string;
    }[];
  };
  status?: string;
};

const CHAIN_LIST: ChainListItem[] = JSON.parse(
  '${replaceAll(JSON.stringify([...chainlist, ...newChains]), "'", '')}'
);


type AssetsBlockchainIdList = { [key in number]: string }
const ASSETS_BLOCKCHAINS_CHAIN_ID: AssetsBlockchainIdList = JSON.parse(
  '${replaceAll(JSON.stringify(ASSETS_BLOCKCHAINS_CHAIN_ID), "'", '')}'
);

export { CHAIN_LIST, ChainListItem, ASSETS_BLOCKCHAINS_CHAIN_ID, AssetsBlockchainIdList };
`
  );
};
