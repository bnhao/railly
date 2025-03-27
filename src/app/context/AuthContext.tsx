"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore } from "@/app/_utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { CustomUser } from "../types/user";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to check if a user has a specific permission
    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const getAuthToken = async (): Promise<string | null> => {
        if (!auth.currentUser) return null;
        try {
            const token = await auth.currentUser.getIdToken(true);
            return token;
        } catch (tokenError) {
            console.error("Error fetching auth token:", tokenError);
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        // Get role from either singular role field or roles array
                        let userRole = userData.role;

                        // If no singular role field but has roles array
                        if (!userRole && Array.isArray(userData.roles) && userData.roles.length > 0) {
                            // Prefer admin role if present
                            if (userData.roles.includes("admin")) {
                                userRole = "admin";
                            } else {
                                userRole = userData.roles[0]; // Use first role
                            }
                        }

                        // Default to user if still no role
                        userRole = userRole || "user";

                        setUser({
                            ...currentUser,
                            roles: Array.isArray(userData.roles) ? userData.roles : [userRole],
                        } as CustomUser);

                        setRole(userRole);

                        // Set permissions based on role
                        if (userRole === "admin") {
                            setPermissions([
                                "users:read", "users:write", "users:delete",
                                "tracks:read", "tracks:write"
                            ]);
                        } else {
                            setPermissions(["tracks:read"]);
                        }
                    } else {
                        setUser(null);
                        setRole(null);
                        setPermissions([]);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(null);
                    setRole(null);
                    setPermissions([]);
                }
                setIsLoading(false);
            } else {
                setUser(null);
                setRole(null);
                setPermissions([]);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setRole(null);
            setPermissions([]);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            permissions,
            isLoading,
            setUser,
            logout,
            getAuthToken,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
