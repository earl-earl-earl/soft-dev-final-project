import { StatusValue } from "../types/reservation";

// Define StatusCategory type since it's not exported from the types module
export type StatusCategory = "Accepted" | "Pending" | "Cancelled" | "Rejected" | "Expired" | "Confirmed_Pending_Payment";

export const statusDescriptions: Record<string, string> = {
  "Pending": "Submitted by customer",
  "Cancelled": "Set by customer only while status is still Pending",
  "Confirmed_Pending_Payment": "Set by staff/admin upon approval",
  "Accepted": "Set manually by staff after verifying downpayment",
  "Rejected": "Set by staff/admin upon rejection",
  "Expired": "Automatically set by the system after 48 hours without payment"
};

// Add this new function to format status for display
export const getStatusDisplay = (status: StatusValue | string): string => {
  // Special case for Confirmed_Pending_Payment
  if (status === "Confirmed_Pending_Payment") {
    return "Confirmed for Downpayment";
  }
  
  // For other statuses, just replace underscores with spaces
  return String(status).replace(/_/g, " ");
};

export const getStatusCategory = (rawStatus: string): StatusCategory => {
  // Make an exact match instead of a partial match
  const status = rawStatus.trim();
  
  if (status === "Accepted") return "Accepted";
  if (status === "Pending") return "Pending";
  if (status === "Cancelled") return "Cancelled";
  if (status === "Rejected") return "Rejected";
  if (status === "Expired") return "Expired";
  if (status === "Confirmed_Pending_Payment") return "Confirmed_Pending_Payment";
  
  // For backward compatibility, if we don't have an exact match:
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("ACCEPTED")) return "Accepted";
  if (upperStatus.includes("CONFIRMED") && upperStatus.includes("PENDING")) return "Confirmed_Pending_Payment";
  if (upperStatus.includes("PENDING")) return "Pending";
  if (upperStatus.includes("CANCELLED")) return "Cancelled";
  if (upperStatus.includes("REJECTED")) return "Rejected";
  if (upperStatus.includes("EXPIRED")) return "Expired";
  
  return "Pending"; // Default fallback
};

export const calculateTotalGuests = (guests: { adults: number; children: number; seniors: number }): number => {
  return guests.adults + guests.children + guests.seniors;
};