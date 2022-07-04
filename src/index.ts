import { generator as chainListGenerator } from './generators/chain-list';
import { generator as tokenListGenerator } from './generators/token-list';
import { generator as rateListGenerator } from './generators/rate-list';

/*
  ############################################################
  ################ chain-list.json generation ################
  ############################################################
*/
(async () => chainListGenerator())();

/*
  ############################################################
  ################ token-list.json generation ################
  ############################################################
*/
(async () => tokenListGenerator())();

/*
  ############################################################
  ############## rates-ids-list.json generation ##############
  ######### asset-platforms-ids-list.json generation #########
  ############################################################
*/
(async () => rateListGenerator())();
