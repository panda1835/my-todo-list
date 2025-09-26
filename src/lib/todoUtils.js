// Helper functions to get special project IDs
export const getSpecialProjectIds = (projects) => {
  const todayProject = projects.find((p) => p.is_special && p.name === "Today");
  const thisWeekProject = projects.find(
    (p) => p.is_special && p.name === "This Week Backlog"
  );

  return {
    TODAY: todayProject?.id,
    THIS_WEEK: thisWeekProject?.id,
  };
};

export const priorityColors = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-200 text-yellow-900",
  HIGH: "bg-red-100 text-red-800",
};

export const priorityOrder = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};
