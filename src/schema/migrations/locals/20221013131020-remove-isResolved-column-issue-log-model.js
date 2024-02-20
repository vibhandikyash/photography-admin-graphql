/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.removeColumn('issue_log', 'is_resolved'),
  ]),
};
