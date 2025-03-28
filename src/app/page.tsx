"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/app/_utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
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
          router.push(roleData === "admin" ? "/admin" : "/dashboard");
        } else {
          setUser(null);
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
    return "Loading...";
  }

  return <div>{user ? <p>Redirecting to dashboard...</p> : <p>Redirecting to login...</p>}</div>;
}
