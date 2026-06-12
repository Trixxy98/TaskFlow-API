import { useEffect, useMemo } from "react";

const hasValidUserShape = (user) =>
  Boolean(user && typeof user.id !== "undefined" && user.email);

export default function useAuthGuard(user) {
  const token = localStorage.getItem("token");
  const hasValidUser = hasValidUserShape(user);
  const isAuthenticated = Boolean(token && hasValidUser);

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
    };
  }, [token, hasValidUser, isAuthenticated]);
}
