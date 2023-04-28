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

const ASSETS_BLOCKCHAINS_CHAIN_ID: { [key in number]: string } = {
  592: 'astar',
  336: 'astar',
  42161: 'arbitrum',
  200: 'arbitrum',
  421611: 'arbitrum',
  1313161554: 'aurora',
  1313161555: 'aurora',
  1313161556: 'aurora',
  43114: 'avalanchec',
  43113: 'avalanchec',
  32520: 'bitgert',
  199: 'bittorrent',
  1028: 'bittorrent',
  288: 'boba',
  28: 'boba',
  188: 'bytom',
  189: 'bytom',
  820: 'callisto',
  821: 'callisto',
  42220: 'celo',
  44787: 'celo',
  62320: 'celo',
  6: 'classic',
  61: 'classic',
  62: 'classic',
  63: 'classic',
  1030: 'conflux',
  71: 'conflux',
  2023: 'cosmos',
  8000: 'cosmos',
  8001: 'cosmos',
  22023: 'cosmos',
  52: 'csc',
  53: 'csc',
  43: 'crab',
  44: 'crab',
  25: 'cronos',
  338: 'cronos',
  53935: 'dfk',
  335: 'dfk',
  20: 'elastos',
  21: 'elastos',
  22: 'elastos',
  23: 'elastos',
  64: 'ellaism',
  39797: 'energi',
  49797: 'energi',
  246: 'energyweb',
  73799: 'energyweb',
  59: 'eos',
  95: 'eos',
  1: 'ethereum',
  3: 'ethereum',
  4: 'ethereum',
  5: 'ethereum',
  42: 'ethereum',
  9000: 'evmos',
  9001: 'evmos',
  250: 'fantom',
  4002: 'fantom',
  2152: 'findora',
  2153: 'findora',
  122: 'fuse',
  123: 'fuse',
  32659: 'fusion',
  60: 'gochain',
  5869: 'gochain',
  31337: 'gochain',
  71393: 'godwoken',
  71401: 'godwoken',
  71402: 'godwoken',
  1666600002: 'harmony',
  1666600003: 'harmony',
  1666600001: 'harmony',
  1666700000: 'harmony',
  1666700001: 'harmony',
  1666700002: 'harmony',
  1666700003: 'harmony',
  128: 'heco',
  256: 'heco',
  70: 'hoo',
  170: 'hoo',
  269: 'hpb',
  4689: 'iotex',
  4690: 'iotex',
  596: 'karura',
  686: 'karura',
  2221: 'kava',
  2222: 'kava',
  321: 'kcc',
  322: 'kcc',
  1337702: 'kin',
  8217: 'klaytn',
  1001: 'klaytn',
  225: 'lachain',
  226: 'lachain',
  82: 'meter',
  83: 'meter',
  1088: 'metis',
  588: 'metis',
  2001: 'milkomeda',
  200101: 'milkomeda',
  1284: 'moonbeam',
  1286: 'moonbeam',
  1287: 'moonbeam',
  1288: 'moonbeam',
  1285: 'moonriver',
  5551: 'nahmii',
  5553: 'nahmii',
  868455272153094: 'nervos',
  26863: 'oasis',
  65: 'okexchain',
  66: 'okexchain',
  58: 'ontology',
  5851: 'ontology',
  10: 'optimism',
  69: 'optimism',
  300: 'optimism',
  420: 'optimism',
  4216137055: 'palm',
  11297108099: 'palm',
  11297108109: 'palm',
  210425: 'platon',
  2203181: 'platon',
  2206132: 'platon',
  77: 'poa',
  99: 'poa',
  333888: 'polis',
  333999: 'polis',
  137: 'polygon',
  80001: 'polygon',
  47805: 'rei',
  55555: 'reichain',
  55556: 'reichain',
  30: 'rsk',
  31: 'rsk',
  10000: 'smartbch',
  10001: 'ethereumpow',
  56: 'smartchain',
  97: 'smartchain',
  245022926: 'solana',
  245022934: 'solana',
  245022940: 'solana',
  19: 'songbird',
  57: 'syscoin',
  40: 'telos',
  41: 'telos',
  361: 'theta',
  363: 'theta',
  364: 'theta',
  365: 'theta',
  108: 'thundercore',
  18: 'thundercore',
  88: 'tomochain',
  89: 'tomochain',
  8: 'ubiq',
  9: 'ubiq',
  106: 'velas',
  888: 'wanchain',
  999: 'wanchain',
  100: 'xdai',
  50: 'xdc',
  51: 'xdc',
  55: 'zyx',
  534354: 'scroll',
  534351: 'scroll',
  324: 'zksync'
};

export { CHAIN_LIST, ASSETS_BLOCKCHAINS_CHAIN_ID, ChainListItem };
`
  );
};
