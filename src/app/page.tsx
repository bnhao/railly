"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/app/_utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (!userDoc.exists()) {
            const registrationData = localStorage.getItem("registrationData");
            const { firstName = "", lastName = "" } = registrationData ? JSON.parse(registrationData) : {};
            await setDoc(doc(firestore, "users", user.uid), {
              firstName,
              lastName,
              email: user.email,
              role: "user",
            });
            localStorage.removeItem("registrationData");
          }

          const roleData = userDoc.exists() ? userDoc.data().role : "user";
          setUser(user);
          setRole(roleData);
          toast.success("Redirecting to dashboard...");
          router.push("/dashboard");
        } else {
          setUser(null);
          toast.error("Please verify your email");
          router.push("/logIn");
        }
      } else {
        setUser(null);
        router.push("/logIn");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return <LoadingSpinner />; // You can replace this with your actual loading spinner component
}
