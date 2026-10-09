"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/utils/firebase";
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#121418] p-4">
      <div className="w-full max-w-md bg-[#1e2128] border border-gray-800/50 p-8 rounded-2xl shadow-2xl shadow-black/40">
        <h3 className="text-center text-2xl font-bold mb-8 text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">RAILLY</h3>
        <form className="space-y-4 md:space-y-6" onSubmit={handleLogIn}>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Email</label>
            <input type="email" id="email" placeholder="johndoe@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full p-3 bg-[#181a20] border border-gray-700 text-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">Password</label>
            <div className="relative w-full">
              <input type={visible ? "text" : "password"} id="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full p-3 mb-2 bg-[#181a20] border border-gray-700 text-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors" required />
              <span className="absolute inset-y-0 flex items-center right-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                <Image src={visible ? "/icons/password-show.svg" : "/icons/password-hide.svg"} alt="" width={20} height={20} onClick={() => setVisible(!visible)} />
              </span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm ">{error}</p>}
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm px-5 py-3.5 transition-colors duration-200 shadow-lg shadow-cyan-500/20 mt-4">Log In</button>
        </form>
        <div className="flex justify-center mt-6">
          <p className="text-gray-400">Don&apos;t have an account? <Link href="/register" className="hover:underline text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign Up here!</Link></p>
        </div>
      </div>
    </div>
  );
}
