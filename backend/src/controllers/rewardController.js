import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const topCitizens = await User.find({ role: 'citizen' })
      .select('name ward greenPoints level levelTitle stats profileImage')
      .sort({ greenPoints: -1 })
      .limit(10);

    const leaderboard = topCitizens.map((citizen, index) => ({
      rank: index + 1,
      id: citizen._id,
      name: citizen.name,
      ward: citizen.ward,
      points: citizen.greenPoints || 0,
      reports: citizen.stats?.reportsSubmitted || 0,
      level: citizen.levelTitle || 'Eco Citizen',
      badge: index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🌱"
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRewards = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.params.userId;
    const rewards = await Reward.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    next(error);
  }
};
