const { join } = require('path');

const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');

const typesArray = [
  ...loadFilesSync(join(__dirname, './**/*.graphql')),
];

const resolverArray = loadFilesSync(join(__dirname, './**/*.resolvers.*'));

const typeDefs = mergeTypeDefs(typesArray);
const resolvers = mergeResolvers(resolverArray);

module.exports = { typeDefs, resolvers };
