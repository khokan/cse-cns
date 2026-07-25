import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Try to extract message from various response structures
    const message =
      (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
        ? data.message
        : null) ||
      (typeof data === "object" && data !== null && "error" in data
        ? typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error)
        : null) ||
      error.message;

    if (status === 400) {
      return message || "Invalid request. Please check your input.";
    }

    if (status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (status === 403) {
      return message || "You don't have permission to perform this action.";
    }

    if (status === 404) {
      return message || "The requested resource was not found.";
    }

    if (status === 409) {
      return message || "This resource already exists.";
    }

    if (status && status >= 500) {
      return "Server error. Please try again later.";
    }

    return message || "Something went wrong";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred";
}