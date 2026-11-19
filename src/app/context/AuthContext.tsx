"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { CustomUser } from "@/types/user";

type AuthContextType = {
  user: CustomUser | null;
  role: string | null;
  permissions: string[];
  isLoading: boolean;
  setUser: (user: CustomUser | null) => void;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
};

type CachedAuthProfile = {
  uid: string;
  role: string;
  roles: string[];
  permissions: string[];
};

const AUTH_CACHE_KEY = "railly_auth_profile_v1";

const ADMIN_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "tracks:read",
  "tracks:write",
];
const USER_PERMISSIONS = ["tracks:read"];

function getPermissionsForRole(userRole: string): string[] {
  return userRole === "admin" ? ADMIN_PERMISSIONS : USER_PERMISSIONS;
}

function readCachedProfile(uid: string): CachedAuthProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthProfile;
    if (parsed && parsed.uid === uid && typeof parsed.role === "string") {
      return parsed;
    }
  } catch {
    // Ignore storage read failures
  }
  return null;
}

function writeCachedProfile(profile: CachedAuthProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    } else {
      window.sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Ignore storage write failures
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(false);
    } catch (tokenError) {
      console.error("Error fetching auth token:", tokenError);
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isActive) return;

      if (!currentUser) {
        writeCachedProfile(null);
        setUser(null);
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      // Hydrate immediately from sessionStorage so reloads do not block on Firestore
      const cached = readCachedProfile(currentUser.uid);
      if (cached) {
        setUser({
          ...currentUser,
          roles: cached.roles,
        } as CustomUser);
        setRole(cached.role);
        setPermissions(cached.permissions);
        setIsLoading(false);
      }

      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (!isActive) return;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          let userRole = userData.role;

          if (
            !userRole &&
            Array.isArray(userData.roles) &&
            userData.roles.length > 0
          ) {
            userRole = userData.roles.includes("admin")
              ? "admin"
              : userData.roles[0];
          }

          userRole = userRole || "user";
          const resolvedRoles = Array.isArray(userData.roles)
            ? userData.roles
            : [userRole];
          const resolvedPermissions = getPermissionsForRole(userRole);

          writeCachedProfile({
            uid: currentUser.uid,
            role: userRole,
            roles: resolvedRoles,
            permissions: resolvedPermissions,
          });

          setUser({
            ...currentUser,
            roles: resolvedRoles,
          } as CustomUser);
          setRole(userRole);
          setPermissions(resolvedPermissions);
        } else {
          writeCachedProfile(null);
          setUser(null);
          setRole(null);
          setPermissions([]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (!cached && isActive) {
          setUser(null);
          setRole(null);
          setPermissions([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      writeCachedProfile(null);
      await signOut(auth);
      setUser(null);
      setRole(null);
      setPermissions([]);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      role,
      permissions,
      isLoading,
      setUser,
      logout,
      getAuthToken,
      hasPermission,
    }),
    [user, role, permissions, isLoading, logout, getAuthToken, hasPermission]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
