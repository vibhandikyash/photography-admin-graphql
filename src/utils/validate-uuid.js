/**
 * Validate UUID
 *
 * @param {string} uuid
 * @returns {boolean} true || false
 */
const validateUUID = uuid => {
  try {
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    return isValidUUID;
  } catch (error) {
    return false;
  }
};

module.exports = validateUUID;
