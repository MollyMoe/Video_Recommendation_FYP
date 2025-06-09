import * as jwt_decode from "jwt-decode";

export function isTokenValid(token) {
  try {
    const decoded = jwt_decode.default(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      console.log("Token expired");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Invalid token", error);
    return false;
  }
}

export function getUserRole(token) {
  try {
    const decoded = jwt_decode.default(token);
    return decoded.role;
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}
