"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/app/_utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/app/context/AuthContext";

export default function LogInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        return;
      }

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      let role = "user";

      if (userDoc.exists()) {
        role = userDoc.data()?.role || "user";
      } else {
        const registrationData = localStorage.getItem("registrationData");
        const { firstName = "", lastName = "" } = registrationData ? JSON.parse(registrationData) : {};

        await setDoc(doc(firestore, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
          role: "user",
          createdAt: new Date().toISOString(),
        });
      }

      setUser({
        uid: user.uid,
        email: user.email,
        roles: [role],
        emailVerified: user.emailVerified,
      });

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-credential":
            setError("Incorrect email or password. Please try again.");
            break;
          case "auth/network-request-failed":
            setError("Network request failed. Please check your internet connection.");
            break;
          default:
            setError(error.message);
        }
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#33313B] p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 ronuded-lg shadow-md">
        <h3 className="text-center text-lg font-bold mb-6 text-white">RAILLY</h3>
        <form className="space-y-4 md:space-y-6" onSubmit={handleLogIn}>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
            <input type="email" id="email" placeholder="johndoe@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
            <div className="relative w-full">
              <input type={visible ? "text" : "password"} id="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full p-2.5 mb-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg" required />
              <span className="absolute inset-y-0 right-3 flex items-center pb-2 cursor-pointer">
                <Image src={visible ? "/icons/password-show.svg" : "/icons/password-hide.svg"} alt="" width={20} height={20} onClick={() => setVisible(!visible)} />
              </span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm ">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5">Log In</button>
        </form>
        <div className="flex justify-center mt-6">
          <p>Don&apos;t have an account? <Link href="/signIn" className="hover:underline text-blue-400">Sign Up here!</Link></p>
        </div>
      </div>
    </div>
  );
}
