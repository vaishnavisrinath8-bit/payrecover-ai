import React, {
  createContext,
  useEffect,
  useState,
} from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RESTORE LOGIN SESSION
  // ============================================================

  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedToken = localStorage.getItem(
          "payrecover_token"
        );

        const savedUser = localStorage.getItem(
          "payrecover_user"
        );

        if (savedToken) {
          setToken(savedToken);
        }

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error(
              "Invalid saved user:",
              error
            );

            localStorage.removeItem(
              "payrecover_user"
            );
          }
        }
      } catch (error) {
        console.error(
          "Authentication restore error:",
          error
        );

        localStorage.removeItem(
          "payrecover_token"
        );

        localStorage.removeItem(
          "payrecover_user"
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = (authData) => {
    const newToken =
      authData?.token ||
      authData?.accessToken ||
      authData?.data?.token ||
      null;

    const newUser =
      authData?.user ||
      authData?.data?.user ||
      null;

    if (!newToken) {
      console.error(
        "Login failed: JWT token missing."
      );

      return false;
    }

    localStorage.setItem(
      "payrecover_token",
      newToken
    );

    setToken(newToken);

    if (newUser) {
      localStorage.setItem(
        "payrecover_user",
        JSON.stringify(newUser)
      );

      setUser(newUser);
    }

    return true;
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    // Clear storage first
    localStorage.removeItem(
      "payrecover_token"
    );

    localStorage.removeItem(
      "payrecover_user"
    );

    // Clear React authentication state
    setToken(null);
    setUser(null);
  };

  // ============================================================
  // UPDATE USER
  // ============================================================

  const updateUser = (updatedUser) => {
    if (!updatedUser) {
      return;
    }

    localStorage.setItem(
      "payrecover_user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  };

  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================

  const isAuthenticated =
    Boolean(token);

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}