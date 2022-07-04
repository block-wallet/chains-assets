import {
  ARBITRUM_TOKEN_LIST_URL,
  ASSETS_LIST_PATH,
  ASSETS_RESOURCES_URL,
  MANUAL_BLOCKCHAINS,
  NETWORKS,
  OPTIMISM_TOKEN_LIST_URL,
  TOKEN_LIST_FILE,
} from '../utils/constants';
import {
  get,
  readdirSync,
  readFileSync,
  writeFileSync,
} from '../utils/helpers';
import { Token } from '../utils/types';

export const generator = async () => {
  const TOKENS: { [key in number]: { [key in string]: Token } } = {};

  const blockchains: string[] = readdirSync(ASSETS_LIST_PATH);
  blockchains.map((blockchain: string) => {
    const chainId: number | undefined = NETWORKS[blockchain];
    if (!chainId) {
      return;
    }

    TOKENS[chainId] = {};

    if (MANUAL_BLOCKCHAINS.includes(chainId)) {
      return;
    }

    const content: string[] = readdirSync(`${ASSETS_LIST_PATH}/${blockchain}`);
    if (content.includes('assets')) {
      const assetsAddress: string[] = readdirSync(
        `${ASSETS_LIST_PATH}/${blockchain}/assets`
      );

      assetsAddress.map((assetAddress) => {
        const tokenInfo: string[] = readdirSync(
          `${ASSETS_LIST_PATH}/${blockchain}/assets/${assetAddress}`
        );

        if (tokenInfo.includes('info.json')) {
          const token = readFileSync<any>(
            `${ASSETS_LIST_PATH}/${blockchain}/assets/${assetAddress}/info.json`
          );

          if (token.status == 'active') {
            TOKENS[chainId][assetAddress] = new Token({
              logo: `${ASSETS_RESOURCES_URL}/${blockchain}/assets/${assetAddress}/logo.png`,
              ...token,
            });
          }
        }
      });
    } else {
      const token = readFileSync<any>(
        `${ASSETS_LIST_PATH}/${blockchain}/info/info.json`
      );

      if (token.status == 'active') {
        TOKENS[chainId][token.name] = new Token({
          logo: `${ASSETS_RESOURCES_URL}/${blockchain}/info/logo.png`,
          ...token,
        });
      }
    }
  });

  // Optimism
  const optimismTokenList = (
    await get<{ tokens: any }>(`${OPTIMISM_TOKEN_LIST_URL}?r=${Math.random()}`)
  ).tokens;
  optimismTokenList
    .filter((token: any) => token.chainId == 10)
    .forEach((token: any) => {
      let optimismBridgeAddress = '';
      if (token.extensions && token.extensions.optimismBridgeAddress) {
        optimismBridgeAddress = token.extensions.optimismBridgeAddress;
      }
      TOKENS[NETWORKS['optimism']][token.address] = new Token({
        address: token.address,
        name: token.name,
        logo: token.logoURI || '',
        type: '',
        symbol: token.symbol,
        decimals: token.decimals,
        l1Bridge: {
          tokenAddress: '',
          bridgeAddress: optimismBridgeAddress,
        },
      });
    });
  optimismTokenList
    .filter((token: any) => token.chainId == 1)
    .forEach((token: any) => {
      if (
        optimismTokenList.some(
          (t: any) => t.chainId == 10 && t.name == token.name
        )
      ) {
        const optimismAddress = optimismTokenList.filter(
          (t: any) => t.chainId == 10 && t.name == token.name
        )[0].address;
        if (
          optimismAddress &&
          optimismAddress in TOKENS[NETWORKS['optimism']]
        ) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          TOKENS[NETWORKS['optimism']][optimismAddress].l1Bridge!.tokenAddress =
            token.address;
        }
      }
    });

  // Arbitrum
  const arbitrumTokenList = (
    await get<{ tokens: any }>(`${ARBITRUM_TOKEN_LIST_URL}?r=${Math.random()}`)
  ).tokens;
  arbitrumTokenList
    .filter((token: any) => parseInt(token.chainId) === NETWORKS['arbitrum'])
    .forEach((token: any) => {
      TOKENS[NETWORKS['arbitrum']][token.address] = new Token({
        address: token.address,
        name: token.name,
        logo: token.logoURI || '',
        type: '',
        symbol: token.symbol,
        decimals: token.decimals,
        l1Bridge: {
          tokenAddress: token.extensions?.l1Address,
          bridgeAddress: token.extensions?.l1GatewayAddress,
        },
      });
    });

  writeFileSync(TOKEN_LIST_FILE, TOKENS);
};
