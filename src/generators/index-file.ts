import { AUTO_GENERATED_FILE_LABEL, INDEX_FILE } from '../utils/constants';
import { writeFileStringSync } from '../utils/helpers';

export const generator = async () => {
  writeFileStringSync(
    INDEX_FILE,
    `${AUTO_GENERATED_FILE_LABEL}

import { ASSET_PLATFORMS_IDS_LIST, AssetPlatformIdList } from './asset-platforms-ids-list';
export { ASSET_PLATFORMS_IDS_LIST, AssetPlatformIdList };
import { CHAIN_LIST, ChainListItem } from './chain-list';
export { CHAIN_LIST, ChainListItem };
import { RATES_IDS_LIST, RateIdList } from './rates-ids-list';
export { RATES_IDS_LIST, RateIdList };
import { TOKENS_LIST } from './token-list';
export { TOKENS_LIST };
`
  );
};
