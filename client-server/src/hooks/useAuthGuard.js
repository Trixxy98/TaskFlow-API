import { useEffect, useMemo } from "react";

const hasValidUserShape = (user) =>
  Boolean(user && typeof user.id !== "undefined" && user.email);

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

export default function useAuthGuard(user) {
  const token = localStorage.getItem("token");
  const hasValidUser = hasValidUserShape(user);
  const tokenExpired = isTokenExpired(token);
  const isAuthenticated = Boolean(token && hasValidUser && !tokenExpired);

  useEffect(() => {
    if (!user) return;
    if (isAuthenticated) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, [user, isAuthenticated]);

  return useMemo(() => {
    return {
      hasToken: Boolean(token),
      hasValidUser,
      isAuthenticated,
      isTokenExpired: tokenExpired,
    };
  }, [token, hasValidUser, isAuthenticated, tokenExpired]);
}
