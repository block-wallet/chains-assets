import axios from "axios";
import fs from "fs";

const readdir = fs.promises.readdir;

const readFileSync = <T>(path: string): T =>
  JSON.parse(fs.readFileSync(path, "utf8")) as T;

const writeFileSync = (path: string, data: any): void =>
  fs.writeFileSync(path, JSON.stringify(data));

const get = async <T>(url: string): Promise<T> => {
  const response = await axios.get(url);
  if (response.status != 200) {
    throw new Error(`Error fetching ${url}`);
  }
  return response.data;
};

(async () => {
  type Chain = {
    name: string;
    chain: string;
    icon: string;
    rpc: string[];
    faucets: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    infoURL: string;
    shortName: string;
    chainId: number;
    networkId: number;
    slip44: number;
    ens: { registry: string };
    logo: string;
    explorers: [
      {
        name: string;
        url: string;
        standard: string;
      }
    ];
  };

  const removeTrailingSlash = (rpc: string) => {
    return rpc.endsWith("/") ? rpc.substring(0, rpc.length - 1) : rpc;
  };

  const parseChain = (chain: Chain): Chain => {
    const rpcs = new Set(
      chain.rpc
        .map(removeTrailingSlash)
        .filter((rpc) => !rpc.includes("${INFURA_API_KEY}"))
    );

    return {
      ...chain,
      rpc: Array.from(rpcs),
    };
  };

  // Fetch chainlist json
  const newChainlist = (
    await get<Chain[]>("https://chainid.network/chains.json")
  ).map(parseChain);

  const currentChainlist = readFileSync<Chain[]>("chain-list.json");
  const diff = newChainlist.filter(
    (c) => !currentChainlist.some((cc) => cc.chainId === c.chainId)
  );

  if (diff.length > 0) {
    console.log(`Found ${diff.length} new chains`);
    writeFileSync("chain-list.json", [...currentChainlist, ...diff]);
  }
})();
