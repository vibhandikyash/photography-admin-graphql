const getTransactionDataToBeUpdateForUpdateStatus = (transactionId, transactionStatus) => {
  const where = {
    id: transactionId,
  };

  const dataToBeUpdate = {
    transactionStatus,
  };

  return [where, dataToBeUpdate];
};

module.exports = { getTransactionDataToBeUpdateForUpdateStatus };
