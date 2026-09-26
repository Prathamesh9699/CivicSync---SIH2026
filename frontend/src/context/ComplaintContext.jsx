import React, { createContext, useContext, useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';
import { syncSquadStatusesWithComplaints, updateSquadStatusOnAssignment } from '../data/teams';

const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshComplaints = async () => {
    try {
      const list = await complaintService.fetchAll();
      const safeList = Array.isArray(list) ? list : [];
      setComplaints(safeList);
      syncSquadStatusesWithComplaints(safeList);
      return safeList;
    } catch (e) {
      console.warn('[ComplaintContext refresh error]', e);
      setComplaints([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshComplaints();
  }, []);

  const addComplaint = async (newComplaint) => {
    const created = await complaintService.create(newComplaint);
    await refreshComplaints();
    return created;
  };

  const updateComplaintStatus = async (id, newStatus, extraData = {}) => {
    const updated = await complaintService.updateStatus(id, newStatus, extraData);
    const refreshed = await refreshComplaints();
    syncSquadStatusesWithComplaints(refreshed);
    return updated;
  };

  const assignTeam = async (id, teamId, teamName, officerNote = "", workerDetails = {}) => {
    // 1. Immediately update squad status to 'Cleaning' in fleet registry
    updateSquadStatusOnAssignment(teamId, teamName);

    // 2. Assign team to complaint
    const updated = await complaintService.assignTeam(id, teamId, teamName, officerNote, workerDetails);
    
    // 3. Refresh and synchronize all squads
    const refreshed = await refreshComplaints();
    syncSquadStatusesWithComplaints(refreshed);
    return updated;
  };

  const verifyCleanup = async (id, isClean, notes = "") => {
    const updated = await complaintService.verifyCleanup(id, isClean, notes);
    const refreshed = await refreshComplaints();
    syncSquadStatusesWithComplaints(refreshed);
    return updated;
  };

  const submitWorkerEvidence = async (id, evidenceData) => {
    const updated = await complaintService.submitWorkerEvidence(id, evidenceData);
    const refreshed = await refreshComplaints();
    syncSquadStatusesWithComplaints(refreshed);
    return updated;
  };

  const startTask = async (id, workerData = {}) => {
    const updated = await complaintService.startTask(id, workerData);
    const refreshed = await refreshComplaints();
    syncSquadStatusesWithComplaints(refreshed);
    return updated;
  };

  const mergeDuplicates = (primaryId, duplicateIds) => {
    const success = complaintService.mergeDuplicates(primaryId, duplicateIds);
    refreshComplaints();
    return success;
  };

  const fetchComplaintById = async (id) => {
    const found = complaints.find(c => c.id === id || c.complaintId === id);
    if (found) return found;
    const item = await complaintService.fetchById(id);
    if (item) {
      setComplaints(prev => {
        if (prev.some(c => c.id === item.id || c.complaintId === item.id)) return prev;
        return [item, ...prev];
      });
    }
    return item;
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      loading,
      refreshComplaints,
      addComplaint,
      fetchComplaintById,
      updateComplaintStatus,
      assignTeam,
      verifyCleanup,
      submitWorkerEvidence,
      startTask,
      mergeDuplicates
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    return {
      complaints: [],
      loading: false,
      refreshComplaints: async () => {},
      addComplaint: async () => {},
      fetchComplaintById: async () => null,
      updateComplaintStatus: async () => {},
      assignTeam: async () => {},
      verifyCleanup: async () => {},
      submitWorkerEvidence: async () => {},
      startTask: async () => {},
      mergeDuplicates: () => false
    };
  }
  return {
    ...context,
    complaints: Array.isArray(context.complaints) ? context.complaints : []
  };
};
