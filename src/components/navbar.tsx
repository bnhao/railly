"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/_utils/firebase";
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
      path: "/trackOverview",
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/logIn");
      toast.success("Logged out successfully", {
        position: "top-center",
      });
    } catch (error) {
      toast.error("Log out failed!", {
        position: "top-center",
      });
      console.error("Log out failed: ", error);
    }
  };

  if (pathName === "/logIn" || pathName === "/signIn") {
    return null;
  }

  return (
    <div
      className={`bg-[#393A3E] flex-shrink-0 h-screen p-5 ${
        isMenuOpen ? "w-64" : "w-20"
      } duration-300 rounded-md sticky top-0`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex" onClick={() => router.push("/dashboard")}>
          <FcEnteringHeavenAlive className="text-4xl cursor-pointer float-left block mr-3" />
          <h1
            className={`text-white font-medium text-2xl duration-300 transform transition-all ${
              isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
            } cursor-pointer`}
          >
            RAILLY
          </h1>
        </div>
        <ul>
          {Menus.map((menu) => {
            const isActive = pathName === menu.path;
            return (
              <li
                key={menu.id}
                className={`text-gray-300 text-sm flex items-center gap-x-4 cursor-pointer p-2 hover:bg-slate-500 rounded-md mt-2 ${
                  isActive && "bg-slate-500"
                }`}
                onClick={() => router.push(menu.path)}
              >
                <span className="text-2xl">{menu.icon}</span>
                <span
                  className={`text-base font-medium flex-1 duration-300 transform transition-all ${
                    isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  }`}
                >
                  {menu.title}
                </span>
              </li>
            );
          })}
        </ul>

        <div
          className={`text-gray-300 text-sm flex items-center gap-x-4 cursor-pointer p-2 hover:bg-slate-500 rounded-md`}
          onClick={handleSignOut}
        >
          <span className="text-2xl">
            <RiLogoutCircleRLine />
          </span>
          <span
            className={`text-base font-medium flex-1 duration-300 transform transition-all ${
              isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            Sign Out
          </span>
        </div>
      </div>
    </div>
  );
}
