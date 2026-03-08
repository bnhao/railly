"use client";

// import { useUserAuth } from "@/app/_utils/auth-context";
import { useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/app/_utils/firebase";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import Image from "next/image";

export default function SignInPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const requirements = [password.length >= 6]; // Set requeriments for password
    const isValid = requirements.every(Boolean); // Check if all requirements are met

    if (isValid) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await sendEmailVerification(user);

        // Save registration data to local storage so that we can pre-fill the sign-in form
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
      } catch (error) {
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case "auth/email-already-in-use":
              setError("This email is already registered. Please sign in.");
              break;
            case "auth/network-request-failed":
              setError(
                "Network request failed. Please check your internet connection."
              );
              break;
            default:
              setError(error.message);
          }
        } else if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    } else {
      setError("Password must be at least 6 characters long");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#33313B] p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-center text-lg font-bold mb-6 text-white">
          RAILLY
        </h3>
        <form className="space-y-4 md:space-y-6" onSubmit={handleSignIn}>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label
                htmlFor="firstName"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="lastName"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="johndoe@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Password
              </label>
              <div className="relative w-full">
                <input
                  type={visible1 ? "text" : "password"}
                  id="password"
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full p-2.5 mb-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <span className="absolute inset-y-0 right-3 flex items-center pb-2 cursor-pointer">
                  <Image
                    src={
                      visible1
                        ? "/icons/password-show.svg"
                        : "/icons/password-hide.svg"
                    }
                    alt=""
                    width={20}
                    height={20}
                    onClick={() => setVisible1(!visible1)}
                  />
                </span>
              </div>
            </div>
            <div className="w-1/2">
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Confirm Password
              </label>
              <div className="relative w-full">
                <input
                  type={visible2 ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full p-2.5 mb-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <span className="absolute inset-y-0 right-3 flex items-center pb-2 cursor-pointer">
                  <Image
                    src={
                      visible2
                        ? "/icons/password-show.svg"
                        : "/icons/password-hide.svg"
                    }
                    alt=""
                    width={20}
                    height={20}
                    onClick={() => setVisible2(!visible2)}
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center mb-4">
            <input
              id="default-checkbox"
              type="checkbox"
              value=""
              required
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="default-checkbox"
              className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              By signing up I accept the{" "}
              <Link href="terms-and-conditions" className="hover:underline text-blue-400">Terms & Conditions</Link>
            </label>
          </div>
          {error && <p className="text-red-500 text-sm ">{error}</p>}
          {message && <p className="text-green-500 text-sm ">{message}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:ring-blue-300"
          >
            Sign Up
          </button>
          <div className="flex justify-center mt-6">
            <p className="mr-1">Already have an account?</p>
            <Link href="/logIn" className="hover:underline text-blue-400">
              Log In here!
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}