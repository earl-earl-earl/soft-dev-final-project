export const createMockDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute);
};

export const formatDateForDisplay = (date: Date | undefined): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};