import {
  CHAINS_DATASOURCE_URL,
  CHAIN_LIST_FILE,
  EXTRA_CHAIN_DATA_FILE,
} from './constants';
import {
  get,
  overloadChainData,
  overloadhainLogoWithAssetsRepository,
  readFileSync,
  rpcFilter,
  writeFileSync,
} from './helpers';
import { Chain, ExtraChainData } from './types';

/*
  ############################################################
  ################ chain-list.json generation ################
  ############################################################
*/
(async () => {
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
})();
