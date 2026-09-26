export const INITIAL_MUNICIPAL_TEAMS = [];

export const MUNICIPAL_TEAMS = INITIAL_MUNICIPAL_TEAMS;

const FLEET_STORAGE_KEY = 'cleantrack_fleet_v5';

export const getStoredTeams = () => {
  try {
    // Clear out old default fleet keys so previous squads don't persist
    localStorage.removeItem('cleantrack_fleet_v3');
    localStorage.removeItem('cleantrack_fleet_v4');
    
    const raw = localStorage.getItem(FLEET_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}
  localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify([]));
  return [];
};

export const saveStoredTeams = (teams) => {
  try {
    localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(teams));
  } catch (e) {}
};

/**
 * Automatically synchronize squad operational statuses with active complaints.
 * When a complaint is 'Assigned', 'In Progress', or 'Awaiting Verification' to a squad,
 * that squad's status automatically becomes 'Cleaning' (amber badge) and activeAssignmentsCount increases.
 * When tasks are completed, the squad automatically reverts to 'Available' (emerald badge).
 */
export const syncSquadStatusesWithComplaints = (complaints = []) => {
  try {
    const teams = getStoredTeams();
    const safeComplaints = Array.isArray(complaints) ? complaints : [];
    
    // Active tasks requiring field presence
    const activeComplaints = safeComplaints.filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'assigned' || s === 'in progress' || s === 'in_progress' || s === 'awaiting verification' || s === 'awaiting_verification';
    });

    const updated = teams.map(t => {
      // Preserve explicit Maintenance status if manually assigned
      if (t.status === 'Maintenance') {
        return t;
      }

      const matchingTasks = activeComplaints.filter(c => {
        const idMatch = c.assignedTeamId && c.assignedTeamId === t.id;
        const nameMatch = c.assignedTeamName && (
          c.assignedTeamName === t.name || 
          t.name?.toLowerCase().includes(c.assignedTeamName?.toLowerCase()) ||
          c.assignedTeamName?.toLowerCase().includes(t.name?.toLowerCase())
        );
        return idMatch || nameMatch;
      });

      const count = matchingTasks.length;
      const isCleaning = count > 0;
      const status = isCleaning ? 'Cleaning' : 'Available';
      const statusColor = isCleaning 
        ? 'bg-amber-100 text-amber-800 border-amber-300' 
        : 'bg-emerald-100 text-emerald-800 border-emerald-300';

      return {
        ...t,
        status,
        statusColor,
        activeAssignmentsCount: count
      };
    });

    saveStoredTeams(updated);
    return updated;
  } catch (e) {
    console.error('Failed to sync squad statuses:', e);
    return getStoredTeams();
  }
};

/**
 * Immediately mark a squad as 'Cleaning' when an assignment is dispatched.
 */
export const updateSquadStatusOnAssignment = (teamId, teamName) => {
  try {
    const teams = getStoredTeams();
    const updated = teams.map(t => {
      const isMatch = (teamId && t.id === teamId) || 
        (teamName && (t.name === teamName || t.name?.toLowerCase().includes(teamName?.toLowerCase())));
      
      if (isMatch) {
        return {
          ...t,
          status: 'Cleaning',
          statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
          activeAssignmentsCount: (t.activeAssignmentsCount || 0) + 1
        };
      }
      return t;
    });

    saveStoredTeams(updated);
    return updated;
  } catch (e) {
    console.error('Failed to update squad status on assignment:', e);
    return getStoredTeams();
  }
};
