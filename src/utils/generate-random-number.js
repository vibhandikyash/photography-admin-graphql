const generateRandomNumber = (digit = 4) => Math.random().toFixed(digit).split('.')[1];

module.exports = generateRandomNumber;
