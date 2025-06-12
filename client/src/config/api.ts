const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = {
  baseUrl: API_URL,
  endpoints: {
    scan: `${API_URL}/api/scan`,
    saveTransaction: `${API_URL}/api/save-transaction`,
    getBalance: (groupId: string) => `${API_URL}/api/balance/${groupId}`,
    sendNotification: `${API_URL}/api/send-notification`,
    getGroups: `${API_URL}/api/groups`,
    createGroup: `${API_URL}/api/groups`,
  },
};

export const handleApiError = (error: any) => {
  console.error("API Error:", error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(error.response.data.error || "An error occurred");
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error("No response from server");
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error("Error setting up request");
  }
};
