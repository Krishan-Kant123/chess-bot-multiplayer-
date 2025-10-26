// ELO rating calculation
const calculateRatingChange = (playerRating, opponentRating, result, kFactor = 32) => {
  // result: 1 for win, 0.5 for draw, 0 for loss
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(kFactor * (result - expectedScore));
};

const getKFactor = (rating, gamesPlayed) => {
  if (gamesPlayed < 30) return 40; // New players
  if (rating < 2100) return 20;
  if (rating < 2400) return 10;
  return 5; // Masters
};

export {
  calculateRatingChange,
  getKFactor
};