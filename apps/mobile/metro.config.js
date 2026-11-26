const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const sharedContracts = path.resolve(__dirname, '../web/packages/contracts/src');
config.watchFolders = [...config.watchFolders, sharedContracts];

module.exports = config;
