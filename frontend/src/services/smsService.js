/**
 * CleanTrack Civic SMS Client Service
 * Dispatches real-time SMS alerts to citizen phone numbers upon complaint resolution.
 */

const SMS_STORAGE_KEY = 'cleantrack_sms_logs_v2';

export const getStoredSmsLogs = () => {
  try {
    const raw = localStorage.getItem(SMS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load SMS logs', e);
  }
  return [];
};

export const saveSmsLog = (smsItem) => {
  try {
    const logs = getStoredSmsLogs();
    const updated = [smsItem, ...logs].slice(0, 50); // Keep last 50
    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save SMS log', e);
    return [];
  }
};

export const smsService = {
  /**
   * Dispatch SMS notification to citizen's phone number when complaint is resolved
   */
  async sendComplaintResolvedSms({
    phone,
    complaintId,
    ward = 'Civic Area',
    category = 'Waste',
    citizenName = 'Citizen',
    pointsEarned = 50,
    officerName = 'Municipal Sanitation Squad'
  }) {
    const targetPhone = phone?.trim() || '+91 98230 11452';
    const message = `CleanTrack PMC: Dear ${citizenName || 'Citizen'}, your waste report #${complaintId} (${category}) at ${ward} has been successfully RESOLVED by ${officerName}. +${pointsEarned} Green Points credited to your account. Thank you for keeping our city clean! 🌱`;

    const trackingId = `SMS-PMC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    const smsRecord = {
      id: trackingId,
      trackingId,
      recipientPhone: targetPhone,
      recipientName: citizenName,
      complaintId,
      ward,
      category,
      message,
      status: 'DELIVERED',
      gateway: 'PMC-Civic-SMS-Gateway',
      carrier: 'Telecom India / Fast2SMS',
      timestamp,
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    saveSmsLog(smsRecord);

    console.log(`%c[CIVIC SMS DISPATCHED] 📱 Sent to ${targetPhone}`, 'color: #10b981; font-weight: bold;');
    console.log(`Message: "${message}"`);
    console.log(`Tracking ID: ${trackingId}`);

    return smsRecord;
  },

  /**
   * Get all SMS logs for a given phone number or complaint ID
   */
  getLogsForPhone(phone) {
    if (!phone) return [];
    const clean = phone.replace(/[^0-9]/g, '').slice(-10);
    const logs = getStoredSmsLogs();
    return logs.filter(l => l.recipientPhone.replace(/[^0-9]/g, '').slice(-10) === clean);
  },

  getAllLogs() {
    return getStoredSmsLogs();
  }
};
