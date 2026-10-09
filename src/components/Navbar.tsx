"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { FcEnteringHeavenAlive } from "react-icons/fc";
import { AiOutlineSchedule } from "react-icons/ai";
import { RiDashboardFill, RiLogoutCircleRLine } from "react-icons/ri";
import { LuTrainTrack } from "react-icons/lu";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { MdOutlineManageAccounts, MdOutlineFeedback } from "react-icons/md";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

export default function Nav() {
  const router = useRouter();
  const pathName = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [activeTop, setActiveTop] = useState<number | null>(null);
  const [activeHeight, setActiveHeight] = useState<number>(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const Menus = [
    {
      title: "Dashboard",
      id: 1,
      icon: <RiDashboardFill />,
      path: "/dashboard",
    },
    {
      title: "Track Overview",
      id: 2,
      icon: <LuTrainTrack />,
      path: "/track-overview",
    },
    {
      title: "Weather",
      id: 3,
      icon: <TiWeatherPartlySunny />,
      path: "/weather",
    },
    {
      title: "Schedule",
      id: 4,
      icon: <AiOutlineSchedule />,
      path: "/schedule",
    },
    {
      title: "Manage User",
      id: 5,
      icon: <MdOutlineManageAccounts />,
      path: "/manageusers",
    },
    {
      title: "Feedback",
      id: 6,
      icon: <MdOutlineFeedback />,
      path: "/feedback",
    },
  ];

  const activeIndex = Menus.findIndex((menu) => pathName.startsWith(menu.path));

  useEffect(() => {
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      setActiveTop(itemRefs.current[activeIndex]?.offsetTop || 0);
      setActiveHeight(itemRefs.current[activeIndex]?.offsetHeight || 0);
    } else {
      setActiveTop(null);
    }
  }, [activeIndex, pathName]);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast.success("Logged out successfully", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });
    } catch (error) {
      toast.error("Log out failed!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });
      console.error("Log out failed: ", error);
    }
  };

  if (pathName === "/login" || pathName === "/register") {
    return null;
  }

  return (
    <div
      className={`bg-[#1a1c23] border-r border-gray-800 flex-shrink-0 h-screen py-6 px-4 ${isMenuOpen ? "w-64" : "w-20"
        } duration-300 sticky top-0 transition-all z-50`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-center pl-2 mb-8" onClick={() => router.push("/dashboard")}>
          <FcEnteringHeavenAlive className="text-4xl cursor-pointer flex-shrink-0 mr-3" />
          <h1
            className={`text-gray-100 font-bold tracking-widest text-xl duration-300 transform transition-all ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden w-0"
              } cursor-pointer`}
          >
            RAILLY
          </h1>
        </div>
                <div className="flex-1 relative">
          {activeTop !== null && (
            <div
              className="absolute left-0 w-full rounded-lg bg-gray-800/60 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{ top: `${activeTop}px`, height: `${activeHeight}px` }}
            ></div>
          )}
          {activeTop !== null && (
            <div
              className="absolute left-0 w-1 h-8 bg-cyan-500 rounded-r-md shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{ top: `${activeTop + (activeHeight / 2) - 16}px` }}
            ></div>
          )}
          <ul className="space-y-2 relative">
            {Menus.map((menu, index) => {
              // Updated active logic to handle sub-paths
              const isActive = pathName.startsWith(menu.path);
              return (
                <li
                  key={menu.id}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  role="button"
                  tabIndex={0}
                  aria-label={menu.title}
                  onKeyDown={(e) => e.key === "Enter" && router.push(menu.path)}
                  className={`relative z-10 text-gray-400 text-sm flex items-center gap-x-4 cursor-pointer p-3 rounded-lg transition-colors duration-200 group ${isActive ? "text-cyan-400" : "hover:bg-gray-800/40 hover:text-gray-200"
                    }`}
                  onClick={() => router.push(menu.path)}
                >
                  <span className={`text-2xl transition-colors duration-200 ${isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-300"}`}>{menu.icon}</span>
                  <span
                    className={`text-base font-medium whitespace-nowrap duration-300 transform transition-all ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden w-0"
                      }`}
                  >
                    {menu.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="Sign Out"
          onKeyDown={(e) => e.key === "Enter" && handleSignOut()}
          className={`text-gray-400 text-sm flex items-center gap-x-4 cursor-pointer p-3 hover:bg-gray-800/40 hover:text-red-400 rounded-lg transition-colors duration-200 group mt-auto`}
          onClick={handleSignOut}
        >
          <span className="text-2xl group-hover:text-red-400 transition-colors">
            <RiLogoutCircleRLine />
          </span>
          <span
            className={`text-base font-medium whitespace-nowrap duration-300 transform transition-all ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden w-0"
              }`}
          >
            Sign Out
          </span>
        </div>
      </div>
    </div>
  );
}
