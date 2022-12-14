import {
  ASSET_PLATFORM_ID_LIST_FILE,
  AUTO_GENERATED_FILE_LABEL,
  COINGECKO_ASSET_PLATFORMS_URL,
  COINGECKO_COINS_LIST_URL,
  RATES_IDS_LIST_FILE,
} from '../utils/constants';
import { get, replaceAll, writeFileStringSync } from '../utils/helpers';

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
    ratesList['ETHW'] = 'ethereumpow';

    writeFileStringSync(
      RATES_IDS_LIST_FILE,
      `${AUTO_GENERATED_FILE_LABEL}

type RateIdList = { [chain in string]: string };

const RATES_IDS_LIST: RateIdList = JSON.parse(
  '${replaceAll(JSON.stringify(ratesList), "'", '')}'
);

export { RATES_IDS_LIST, RateIdList };
`
    );
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

    writeFileStringSync(
      ASSET_PLATFORM_ID_LIST_FILE,
      `${AUTO_GENERATED_FILE_LABEL}

type AssetPlatformIdList = { [chain in string]: string };

const ASSET_PLATFORMS_IDS_LIST: AssetPlatformIdList = JSON.parse(
  '${replaceAll(JSON.stringify(assetPlatforms), "'", '')}'
);

export { ASSET_PLATFORMS_IDS_LIST, AssetPlatformIdList };
`
    );
  })();
};
