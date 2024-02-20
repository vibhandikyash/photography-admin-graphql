const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { WEDLANCER_COORDINATOR } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const userLogger = require('../user-logger');

const searchColumns = ['full_name', 'user_name'];

const wedlancerCoordinators = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    let sqlDataQuery; let replacements = {};
    const { filter: { skip = 0, limit = QUERY_PAGING_MIN_COUNT, search } } = args;

    sqlDataQuery = `select "id", "full_name" as "fullName", "user_name" as "userName", "email", "verification_status" as "verificationStatus", "contact_no" as "contactNo", "country_code" as "countryCode", "role", "is_active" as "isActive"
    from public."users"
    where (("role" = :role  and "id" != :userId) and deleted_at is null and account_deleted_at is null) `;
    replacements = { ...replacements, role: WEDLANCER_COORDINATOR, userId: user.id };

    if (search) {
      searchColumns.forEach(field => {
        if (searchColumns.indexOf(field) === 0) {
          sqlDataQuery += ` and (${field} ilike :searchValue`;
        } else if (searchColumns.indexOf(field) === (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} ilike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} ilike :searchValue`;
        }
      });
      replacements = { ...replacements, searchValue: `%${search}%` };
    }

    sqlDataQuery += ' group by id limit :limit offset :skip';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    replacements = {
      ...replacements,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = { count: parseInt(count[0].count, 10), data };
    return result;
  } catch (error) {
    userLogger(`Error from  getting wedlancer coordinators list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = wedlancerCoordinators;
