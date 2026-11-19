"use client";
import { useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/utils/firebase";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff, TrainFront } from "lucide-react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCredential.user);

      localStorage.setItem(
        "registrationData",
        JSON.stringify({ firstName, lastName, email })
      );

      setMessage("Account created successfully. Please verify your email.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError("This email is already registered. Please sign in.");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0d1015] p-4">
      <div className="w-full max-w-md bg-[#151921] border border-[#242a36] p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <span className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mb-3">
            <TrainFront className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest">
            RAILLY
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create Crew / Operator Account
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-firstName"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                First Name
              </label>
              <input
                type="text"
                id="reg-firstName"
                autoComplete="given-name"
                placeholder="Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reg-lastName"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Last Name
              </label>
              <input
                type="text"
                id="reg-lastName"
                autoComplete="family-name"
                placeholder="Rivera"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Email
            </label>
            <input
              type="email"
              id="reg-email"
              autoComplete="email"
              placeholder="operator@railway.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-password"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={visible1 ? "text" : "password"}
                  id="reg-password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
                <button
                  type="button"
                  aria-label={visible1 ? "Hide password" : "Show password"}
                  onClick={() => setVisible1((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {visible1 ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Confirm
              </label>
              <div className="relative">
                <input
                  type={visible2 ? "text" : "password"}
                  id="reg-confirm"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 bg-[#0d1015] border border-[#242a36] text-gray-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
                <button
                  type="button"
                  aria-label={
                    visible2 ? "Hide confirm password" : "Show confirm password"
                  }
                  onClick={() => setVisible2((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {visible2 ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="reg-terms"
              type="checkbox"
              required
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <label htmlFor="reg-terms" className="text-xs text-gray-400">
              By signing up I accept the{" "}
              <Link
                href="/terms-and-conditions"
                className="hover:underline text-cyan-400 font-medium"
              >
                Terms & Conditions
              </Link>
            </label>
          </div>

          {error && (
            <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-500/30 rounded-lg p-2.5">
              {error}
            </p>
          )}
          {message && (
            <p className="text-emerald-300 text-xs bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm px-5 py-3 transition-colors"
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>

          <div className="flex justify-center pt-2 text-xs">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="hover:underline text-cyan-400 font-medium"
              >
                Sign In here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
