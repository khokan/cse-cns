/**
 * Maps error messages to user-friendly toast messages
 * Centralized error message handling for subscription operations
 */

export interface ToastMessage {
  title: string;
  description: string;
}

export function mapSubscriptionErrorToToast(rawMessage: string): ToastMessage {
  const message = rawMessage.toLowerCase();

  // Validation errors
  if (message.includes("student not found") || message.includes("invalid user")) {
    return {
      title: "Profile not found",
      description: "Your student profile is missing. Please contact support.",
    };
  }

  if (message.includes("plan not found") || message.includes("plan does not exist")) {
    return {
      title: "Plan unavailable",
      description: "This plan is no longer available. Please select another plan.",
    };
  }

  // Duplicate/conflict errors
  if (message.includes("already exists")) {
    return {
      title: "Subscription already exists",
      description: "You already have a subscription. Please go to My Subscriptions and click Pay Now.",
    };
  }

  if (message.includes("already paid")) {
    return {
      title: "Already paid",
      description: "This subscription is already paid and active.",
    };
  }

  // Authentication errors
  if (message.includes("unauthorized")) {
    return {
      title: "Unauthorized",
      description: "Your session has expired. Please log in again.",
    };
  }

  // Balance/payment errors
  if (message.includes("insufficient balance") || message.includes("insufficient funds")) {
    return {
      title: "Insufficient balance",
      description: "You don't have enough balance. Please add funds first.",
    };
  }

  // Validation/input errors
  if (message.includes("missing required fields") || message.includes("invalid request")) {
    return {
      title: "Invalid request",
      description: "Please complete all required fields and try again.",
    };
  }

  // Server errors
  if (message.includes("server error") || message.includes("try again later")) {
    return {
      title: "Server error",
      description: "The server is experiencing issues. Please try again later.",
    };
  }

  // Default fallback
  return {
    title: "Subscription failed",
    description: rawMessage || "Failed to create subscription. Please try again.",
  };
}
