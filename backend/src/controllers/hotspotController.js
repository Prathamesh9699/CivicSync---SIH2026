import { Hotspot } from '../models/Hotspot.js';

export const getHotspots = async (req, res, next) => {
  try {
    const { ward, severity } = req.query;
    const query = {};

    if (ward && ward !== 'All') {
      query.ward = { $regex: ward, $options: 'i' };
    }

    if (severity && severity !== 'All') {
      query.severity = severity;
    }

    const hotspots = await Hotspot.find(query).sort({ severityScore: -1 });

    res.json({
      success: true,
      count: hotspots.length,
      hotspots
    });
  } catch (error) {
    next(error);
  }
};

export const getHotspotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotspot = await Hotspot.findOne({
      $or: [{ hotspotId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!hotspot) {
      return res.status(404).json({ success: false, message: 'Hotspot not found' });
    }

    res.json({
      success: true,
      hotspot
    });
  } catch (error) {
    next(error);
  }
};
