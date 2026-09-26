import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';

export const rewardService = {
  /**
   * Awards Green Points transactionally to a user
   */
  async awardPoints({ userId, complaintId, type, points, description }) {
    try {
      // Check if this reward was already awarded
      if (complaintId) {
        const existing = await Reward.findOne({ userId, complaintId, type });
        if (existing) {
          console.log(`[RewardService] Points already awarded for complaint ${complaintId} and type ${type}`);
          return { success: false, message: 'Points already awarded for this event', reward: existing };
        }
      }

      const reward = await Reward.create({
        userId,
        complaintId,
        type,
        points,
        description
      });

      // Update User Points
      const user = await User.findById(userId);
      if (user) {
        user.greenPoints = (user.greenPoints || 0) + points;
        if (type === 'cleanup_verified') {
          user.stats = user.stats || {};
          user.stats.reportsVerified = (user.stats.reportsVerified || 0) + 1;
        } else if (type === 'report_submitted') {
          user.stats = user.stats || {};
          user.stats.reportsSubmitted = (user.stats.reportsSubmitted || 0) + 1;
        }

        // Check for level advancements
        if (user.greenPoints >= 2500) {
          user.level = 5;
          user.levelTitle = "Green Champion";
        } else if (user.greenPoints >= 1000) {
          user.level = 4;
          user.levelTitle = "Eco Guardian";
        } else if (user.greenPoints >= 500) {
          user.level = 3;
          user.levelTitle = "Clean City Contributor";
        }

        await user.save();
      }

      return { success: true, reward, totalPoints: user?.greenPoints };
    } catch (error) {
      console.error('[RewardService Error]', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get points ledger for a user
   */
  async getUserRewards(userId) {
    return await Reward.find({ userId }).sort({ createdAt: -1 });
  }
};
