import {
  ASSET_PLATFORM_ID_LIST_FILE,
  COINGECKO_ASSET_PLATFORMS_URL,
  COINGECKO_COINS_LIST_URL,
  RATE_ID_LIST_FILE,
} from '../utils/constants';
import { get, writeFileSync } from '../utils/helpers';

export const generator = async () => {
  await (async () => {
    // Fetch Coingecko coins list
    const coinGeckoList = await get<
      { id: string; symbol: string; name: string }[]
    >(COINGECKO_COINS_LIST_URL);
    const ratesList = {} as { [key: string]: string };
    coinGeckoList.forEach((t) => {
      ratesList[t.symbol.toUpperCase()] = t.id;
    });

    // exceptions
    ratesList['FTM'] = 'fantom';
    ratesList['ETH'] = 'ethereum';

    writeFileSync(RATE_ID_LIST_FILE, ratesList);
  })();

  await (async () => {
    // Fetch Coingecko asset platforms list
    const coinGeckoList = await get<
      {
        id: string;
        chain_identifier: number;
        name: string;
        shortname: string;
      }[]
    >(COINGECKO_ASSET_PLATFORMS_URL);
    const assetPlatforms = {} as { [chainId: number]: string };

    coinGeckoList.forEach((t) => {
      if (t.chain_identifier) {
        assetPlatforms[t.chain_identifier] = t.id;
      }
    });

    writeFileSync(ASSET_PLATFORM_ID_LIST_FILE, assetPlatforms);
  })();
};
