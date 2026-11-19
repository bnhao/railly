import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const useUserSession = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      if (currentUser) {
        if (currentUser.emailVerified) {
          try {
            const userDoc = await getDoc(
              doc(firestore, "users", currentUser.uid)
            );
            if (!active) return;

            if (!userDoc.exists()) {
              const registrationData = localStorage.getItem("registrationData");
              const { firstName = "", lastName = "" } = registrationData
                ? JSON.parse(registrationData)
                : {};
              await setDoc(doc(firestore, "users", currentUser.uid), {
                firstName,
                lastName,
                email: currentUser.email,
                role: "user",
              });
              localStorage.removeItem("registrationData");
            }

            const roleData = userDoc.exists() ? userDoc.data().role : "user";
            setUser(currentUser);
            setRole(roleData);
            router.replace("/dashboard");
          } catch (error) {
            console.error("Error resolving user session:", error);
            router.replace("/login");
          }
        } else {
          setUser(null);
          router.replace("/login");
        }
      } else {
        setUser(null);
        router.replace("/login");
      }

      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  return { user, role, loading };
};
