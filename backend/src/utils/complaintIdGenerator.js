/**
 * Generates human-readable, sequential, year-stamped Complaint IDs.
 * Format: CT-YYYY-NNNNN (e.g. CT-2026-00124)
 */
export const generateComplaintId = async (ComplaintModel) => {
  const currentYear = new Date().getFullYear();
  const prefix = `CT-${currentYear}-`;

  try {
    const count = await ComplaintModel.countDocuments();
    const nextNumber = count + 125; // Base offset to align with sample records
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  } catch (e) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomSuffix}`;
  }
};
