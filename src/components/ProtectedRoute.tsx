"use client";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type ProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles?: string[];
    requiredPermissions?: string[];
};

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    requiredPermissions = []
}: ProtectedRouteProps) => {
    const { user, role, isLoading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            toast.info("Loading...");
            return;
        }

        if (!user) {
            toast.error("You are not logged in. Redirecting to login page...");
            router.push("/logIn");
            return;
        }

        if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
            toast.error("You don't have permission to access this page. Redirecting...");
            router.push("/unauthorized");
            return;
        }

        if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every(permission =>
                hasPermission(permission)
            );

            if (!hasAllPermissions) {
                toast.error("You don't have the required permissions. Redirecting...");
                router.push("/unauthorized");
            }
        }
    }, [user, role, isLoading, allowedRoles, requiredPermissions, router, hasPermission]);

    if (isLoading || !user || (allowedRoles.length > 0 && role && !allowedRoles.includes(role))) {
        return null;
    }

    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
            hasPermission(permission)
        );
        if (!hasAllPermissions) {
            return null;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
