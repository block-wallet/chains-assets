import axios from 'axios';
import fs from 'fs';

export const readdirSync = fs.readdirSync;

export const readFileSync = <T>(path: string): T =>
  JSON.parse(fs.readFileSync(path, 'utf8')) as T;

export const writeFileSync = (path: string, data: any): void =>
  fs.writeFileSync(path, JSON.stringify(data));

export const writeFileStringSync = (path: string, data: string): void =>
  fs.writeFileSync(path, data);

export const get = async <T>(url: string): Promise<T> => {
  const response = await axios.get(url, {
    headers: { 'Accept-Encoding': 'gzip,deflate,compress', Accept: '*/*' },
  });
  if (response.status != 200) {
    throw new Error(`Error fetching ${url}`);
  }
  return response.data;
};

export const removeTrailingSlash = (rpc: string) => {
  return rpc.endsWith('/') ? rpc.substring(0, rpc.length - 1) : rpc;
};

export const replaceAll = function (
  target: string,
  search: string,
  replacement: string
): string {
  return target.split(search).join(replacement);
};
