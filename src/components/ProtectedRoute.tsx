"use client";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
};

const EMPTY_LIST: string[] = [];

const ProtectedRoute = ({
  children,
  allowedRoles = EMPTY_LIST,
  requiredPermissions = EMPTY_LIST,
  fallback,
}: ProtectedRouteProps) => {
  const { user, role, isLoading, permissions } = useAuth();
  const router = useRouter();

  // Stabilize inline array props so effects never thrash on re-renders
  const allowedRolesKey = allowedRoles.join(",");
  const requiredPermissionsKey = requiredPermissions.join(",");

  const isRoleAllowed =
    allowedRoles.length === 0 || !role || allowedRoles.includes(role);
  const hasAllPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every((permission) => permissions.includes(permission));

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isRoleAllowed || !hasAllPermissions) {
      router.replace("/unauthorized");
    }
  }, [
    user,
    role,
    isLoading,
    isRoleAllowed,
    hasAllPermissions,
    allowedRolesKey,
    requiredPermissionsKey,
    router,
  ]);

  if (isLoading) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isRoleAllowed || !hasAllPermissions) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
