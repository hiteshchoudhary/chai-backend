import { jwtDecode } from "jwt-decode"; // Ensure to install: npm install jwt-decode

interface JWTPayload {
  exp: number; // unix timestamp in seconds
  iat?: number; // issued at timestamp in seconds
  [key: string]: any; // Allow for additional properties
}

// Helper to determine if token needs refresh
export const checkIfTokenNeedsRefresh = (token: string) => {
  if (!token) return false;

  try {
    const decodedToken = jwtDecode<JWTPayload>(token); // Decode the JWT token
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeLeft = decodedToken?.exp - currentTime; // Time left in seconds

    // Return true if less than 5 minutes (300 seconds) are left

    return timeLeft < 300;
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
};
