import {
  ARBITRUM_TOKEN_LIST_URL,
  ASSETS_LIST_PATH,
  ASSETS_RESOURCES_URL,
  AUTO_GENERATED_FILE_LABEL,
  MANUAL_BLOCKCHAINS,
  NETWORKS,
  OPTIMISM_TOKEN_LIST_URL,
  TOKEN_LIST_FILE,
} from '../utils/constants';
import {
  get,
  readdirSync,
  readFileSync,
  replaceAll,
  writeFileStringSync,
} from '../utils/helpers';
import { Token } from '../utils/types';
import isTokenExcluded from 'banned-assets';
import { isValidAddress, toChecksumAddress } from 'ethereumjs-util';

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
        if (!isTokenExcluded(chainId, assetAddress)) {
          const tokenInfo: string[] = readdirSync(
            `${ASSETS_LIST_PATH}/${blockchain}/assets/${assetAddress}`
          );

          if (tokenInfo.includes('info.json')) {
            const token = readFileSync<any>(
              `${ASSETS_LIST_PATH}/${blockchain}/assets/${assetAddress}/info.json`
            );

            if (token.status == 'active') {
              let checkSummedAddress = assetAddress;
              if (isValidAddress(checkSummedAddress)) {
                checkSummedAddress = toChecksumAddress(checkSummedAddress);
              }

              TOKENS[chainId][checkSummedAddress] = new Token({
                logo: `${ASSETS_RESOURCES_URL}/${blockchain}/assets/${assetAddress}/logo.png`,
                ...token,
              });
            }
          }
        }
      });
    } else {
      const token = readFileSync<any>(
        `${ASSETS_LIST_PATH}/${blockchain}/info/info.json`
      );

      if (!isTokenExcluded(chainId, token.name)) {
        if (token.status == 'active') {
          TOKENS[chainId][token.name] = new Token({
            logo: `${ASSETS_RESOURCES_URL}/${blockchain}/info/logo.png`,
            ...token,
          });
        }
      }
    }
  });

  // Optimism
  const optimismTokenList = (
    await get<{ tokens: any }>(`${OPTIMISM_TOKEN_LIST_URL}?r=${Math.random()}`)
  ).tokens;
  optimismTokenList
    .filter((token: any) => parseInt(token.chainId) === NETWORKS['optimism'])
    .filter(
      (token: any) => !isTokenExcluded(NETWORKS['optimism'], token.address)
    )
    .forEach((token: any) => {
      let optimismBridgeAddress = '';
      if (token.extensions && token.extensions.optimismBridgeAddress) {
        optimismBridgeAddress = token.extensions.optimismBridgeAddress;
      }

      let checkSummedAddress = token.address;
      if (isValidAddress(checkSummedAddress)) {
        checkSummedAddress = toChecksumAddress(checkSummedAddress);
      }

      TOKENS[NETWORKS['optimism']][checkSummedAddress] = new Token({
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
    .filter((token: any) => parseInt(token.chainId) === NETWORKS['ethereum'])
    .filter(
      (token: any) => !isTokenExcluded(NETWORKS['ethereum'], token.address)
    )
    .forEach((token: any) => {
      if (
        optimismTokenList.some(
          (t: any) => t.chainId == 10 && t.name == token.name
        )
      ) {
        const optimismAddress = toChecksumAddress(
          optimismTokenList.find(
            (t: any) => t.chainId == 10 && t.name == token.name
          ).address
        );

        if (
          optimismAddress &&
          optimismAddress in TOKENS[NETWORKS['optimism']]
        ) {
          let checkSummedAddress = token.address;
          if (isValidAddress(checkSummedAddress)) {
            checkSummedAddress = toChecksumAddress(checkSummedAddress);
          }

          TOKENS[NETWORKS['optimism']][optimismAddress].l1Bridge!.tokenAddress =
            checkSummedAddress;
        }
      }
    });

  // Arbitrum
  const arbitrumTokenList = (
    await get<{ tokens: any }>(`${ARBITRUM_TOKEN_LIST_URL}?r=${Math.random()}`)
  ).tokens;
  arbitrumTokenList
    .filter((token: any) => parseInt(token.chainId) === NETWORKS['arbitrum'])
    .filter(
      (token: any) => !isTokenExcluded(NETWORKS['arbitrum'], token.address)
    )
    .forEach((token: any) => {
      let checkSummedAddress = token.address;
      if (isValidAddress(checkSummedAddress)) {
        checkSummedAddress = toChecksumAddress(checkSummedAddress);
      }

      if (!TOKENS[NETWORKS['arbitrum']][checkSummedAddress]) {
        TOKENS[NETWORKS['arbitrum']][checkSummedAddress] = new Token({
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
      }
    });

  writeFileStringSync(
    TOKEN_LIST_FILE,
    `${AUTO_GENERATED_FILE_LABEL}

const TOKENS_LIST: {
  [key in string]: { [key in string]: { [key in string]: any } };
} = JSON.parse(
  '${replaceAll(JSON.stringify(TOKENS), "'", '')}'
);

export { TOKENS_LIST };
`
  );
};
