import { generator as chainListGenerator } from './generators/chain-list';
import { generator as tokenListGenerator } from './generators/token-list';
import { generator as rateListGenerator } from './generators/rate-list';
import { generator as indexFileGenerator } from './generators/index-file';

/*
  ############################################################
  ################ chain-list.ts generation ################
  ############################################################
*/
(async () => chainListGenerator())();

/*
  ############################################################
  ################ token-list.ts generation ################
  ############################################################
*/
(async () => tokenListGenerator())();

/*
  ############################################################
  ############## rates-ids-list.ts generation ##############
  ######### asset-platforms-ids-list.ts generation #########
  ############################################################
*/
(async () => rateListGenerator())();

/*
  ############################################################
  ################### index.ts generation ###################
  ############################################################
*/
(async () => indexFileGenerator())();
