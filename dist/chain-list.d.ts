type ChainListItem = {
    name: string;
    chain: string;
    title?: string;
    icon?: string;
    logo?: string;
    rpc: string[];
    faucets: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    nativeCurrencyIcon?: string;
    infoURL: string;
    shortName: string;
    chainId: number;
    networkId: number;
    network?: string;
    isTestnet?: boolean;
    slip44?: number;
    ens?: {
        registry: string;
    };
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
declare const CHAIN_LIST: ChainListItem[];
type AssetsBlockchainIdList = {
    [key in number]: string;
};
declare const ASSETS_BLOCKCHAINS_CHAIN_ID: AssetsBlockchainIdList;
export { CHAIN_LIST, ChainListItem, ASSETS_BLOCKCHAINS_CHAIN_ID, AssetsBlockchainIdList };
