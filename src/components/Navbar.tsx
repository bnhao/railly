"use client";
import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import {
  LayoutDashboard,
  Route,
  CloudSunRain,
  CalendarClock,
  Users,
  MessageSquareText,
  LogOut,
  TrainFront,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { preloadRailwayGeoJSON } from "@/utils/railwayDataCache";

const ALL_MENUS = [
  {
    title: "Dashboard",
    shortTitle: "Home",
    id: 1,
    Icon: LayoutDashboard,
    path: "/dashboard",
    preloadMap: true,
    adminOnly: false,
  },
  {
    title: "Track Overview",
    shortTitle: "Tracks",
    id: 2,
    Icon: Route,
    path: "/track-overview",
    preloadMap: true,
    adminOnly: false,
  },
  {
    title: "Weather Risks",
    shortTitle: "Weather",
    id: 3,
    Icon: CloudSunRain,
    path: "/weather",
    preloadMap: false,
    adminOnly: false,
  },
  {
    title: "Work Schedule",
    shortTitle: "Schedule",
    id: 4,
    Icon: CalendarClock,
    path: "/schedule",
    preloadMap: false,
    adminOnly: false,
  },
  {
    title: "Manage Crew",
    shortTitle: "Crew",
    id: 5,
    Icon: Users,
    path: "/manageusers",
    preloadMap: false,
    adminOnly: true,
  },
  {
    title: "Field Reports",
    shortTitle: "Reports",
    id: 6,
    Icon: MessageSquareText,
    path: "/feedback",
    preloadMap: false,
    adminOnly: false,
  },
] as const;

// 44px height + 8px vertical gap = 52px row pitch for GPU translateY indicator
const ITEM_HEIGHT_PX = 44;
const ITEM_STEP_PX = 52;

function Nav() {
  const router = useRouter();
  const pathName = usePathname();
  const { role, user } = useAuth();

  const visibleMenus = useMemo(() => {
    const isAdmin = role === "admin";
    return ALL_MENUS.filter((m) => !m.adminOnly || isAdmin);
  }, [role]);

  const activeIndex = visibleMenus.findIndex((menu) =>
    pathName.startsWith(menu.path)
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Log out failed:", error);
    }
  }, [router]);

  if (pathName === "/login" || pathName === "/register") {
    return null;
  }

  return (
    <>
      {/* Desktop / Tablet fixed non-reflowing sidebar rail */}
      <aside className="hidden md:block md:w-16 lg:w-56 flex-shrink-0 no-print">
        <nav
          aria-label="Main Navigation"
          className="fixed left-0 top-0 h-screen md:w-16 lg:w-56 bg-[#10141c] border-r border-[#242a36] py-5 px-2.5 lg:px-3.5 z-40 flex flex-col justify-between"
        >
          <div>
            <Link
              href="/dashboard"
              prefetch={true}
              onMouseEnter={preloadRailwayGeoJSON}
              className="flex items-center justify-center lg:justify-start gap-2.5 px-2 mb-6"
            >
              <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <TrainFront className="w-5 h-5" />
              </span>
              <span className="hidden lg:block min-w-0">
                <span className="block text-sm font-bold tracking-widest text-gray-100">
                  RAILLY
                </span>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  {role === "admin" ? "Supervisor" : "Field Crew"}
                </span>
              </span>
            </Link>

            <div className="relative">
              {activeIndex !== -1 && (
                <>
                  <div
                    className="absolute left-0 top-0 w-full rounded-lg bg-[#1b202b] border border-[#2a3140] transition-transform duration-200 ease-out pointer-events-none"
                    style={{
                      height: `${ITEM_HEIGHT_PX}px`,
                      transform: `translateY(${activeIndex * ITEM_STEP_PX}px)`,
                    }}
                  />
                  <div
                    className="absolute left-0 top-0 w-1 h-7 bg-cyan-400 rounded-r-md transition-transform duration-200 ease-out pointer-events-none"
                    style={{
                      transform: `translateY(${activeIndex * ITEM_STEP_PX + 8}px)`,
                    }}
                  />
                </>
              )}

              <ul className="space-y-2 relative">
                {visibleMenus.map((menu) => {
                  const isActive = pathName.startsWith(menu.path);
                  const Icon = menu.Icon;
                  return (
                    <li key={menu.id} className="h-[44px]">
                      <Link
                        href={menu.path}
                        prefetch={true}
                        aria-label={menu.title}
                        title={menu.title}
                        onMouseEnter={
                          menu.preloadMap ? preloadRailwayGeoJSON : undefined
                        }
                        onFocus={
                          menu.preloadMap ? preloadRailwayGeoJSON : undefined
                        }
                        className={`relative z-10 h-full text-sm flex items-center justify-center lg:justify-start gap-x-3 px-3 rounded-lg transition-colors duration-150 ${
                          isActive
                            ? "text-cyan-400 font-semibold"
                            : "text-gray-400 hover:bg-[#181d27] hover:text-gray-200"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:inline truncate">
                          {menu.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#242a36] pt-3">
            {user?.email && (
              <div className="hidden lg:block px-2 py-1">
                <p className="text-[11px] text-gray-500 uppercase font-mono">
                  Signed In
                </p>
                <p className="text-xs text-gray-300 truncate">{user.email}</p>
              </div>
            )}
            <button
              type="button"
              aria-label="Sign Out"
              title="Sign Out"
              onClick={handleSignOut}
              className="w-full h-11 flex items-center justify-center lg:justify-start gap-x-3 px-3 rounded-lg text-sm text-gray-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors duration-150"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile compact header bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#10141c] border-b border-[#242a36] px-4 py-2.5 flex items-center justify-between no-print">
        <Link href="/dashboard" className="flex items-center gap-2">
          <TrainFront className="w-5 h-5 text-cyan-400" />
          <span className="font-bold tracking-widest text-sm text-gray-100">
            RAILLY
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            {role === "admin" ? "Supervisor" : "Crew"}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign Out"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-rose-300 hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Mobile bottom tab navigation with 44px+ touch targets */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#10141c] border-t border-[#242a36] px-1 py-1 no-print"
      >
        <ul className="grid grid-flow-col auto-cols-fr gap-1">
          {visibleMenus.map((menu) => {
            const isActive = pathName.startsWith(menu.path);
            const Icon = menu.Icon;
            return (
              <li key={menu.id}>
                <Link
                  href={menu.path}
                  aria-label={menu.title}
                  className={`min-h-[44px] flex flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#1b202b] text-cyan-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="truncate max-w-full">{menu.shortTitle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default memo(Nav);
