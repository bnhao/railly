"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff, TrainFront } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function LogInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogIn = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        setIsSubmitting(false);
        return;
      }

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      let role = "user";

      if (userDoc.exists()) {
        role = userDoc.data()?.role || "user";
      } else {
        const registrationData = localStorage.getItem("registrationData");
        const { firstName = "", lastName = "" } = registrationData
          ? JSON.parse(registrationData)
          : {};

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
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
            setError("Incorrect email or password. Please try again.");
            break;
          case "auth/network-request-failed":
            setError(
              "Network request failed. Please check your internet connection."
            );
            break;
          default:
            setError(err.message);
        }
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0d1015] p-4">
      <div className="w-full max-w-md bg-[#151921] border border-[#242a36] p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-7">
          <span className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mb-3">
            <TrainFront className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest">
            RAILLY
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Railway Operations & Dispatch Login
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogIn}>
          <div>
            <label
              htmlFor="login-email"
              className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Email
            </label>
            <input
              type="email"
              id="login-email"
              autoComplete="email"
              placeholder="operator@railway.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Password
            </label>
            <div className="relative w-full">
              <input
                type={visible ? "text" : "password"}
                id="login-password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-11 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-200"
              >
                {visible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-500/30 rounded-lg p-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm px-5 py-3 transition-colors mt-2"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="flex justify-center mt-6 text-xs">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="hover:underline text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
