"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const errObj = error as {
      message?: unknown;
      statusText?: unknown;
      code?: unknown;
    };

    if (typeof errObj.message === "string" && errObj.message.trim()) {
      return errObj.message;
    }

    if (typeof errObj.statusText === "string" && errObj.statusText.trim()) {
      return errObj.statusText;
    }

    if (typeof errObj.code === "string" && errObj.code.trim()) {
      return errObj.code;
    }
  }

  return "Login failed. Please check your credentials.";
}

export default function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const result = (await authClient.signIn.email({
        email: email as string,
        password: password as string,
      })) as unknown;

      const signInError =
        typeof result === "object" && result !== null && "error" in result
          ? (result as { error?: unknown }).error
          : null;

      const signInErrorMessage = getErrorMessage(signInError);

      if (signInErrorMessage) {
        setErrorMessage(signInErrorMessage);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {typeof errorMessage === "string"
              ? errorMessage
              : "Login failed. Please try again."}
          </div>
        ) : null}
        <div>
          <label
            htmlFor="email"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm/6 font-medium text-gray-900"
            >
              Password
            </label>
            <div className="text-sm">
              <a
                href="#"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </a>
            </div>
          </div>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm/6 text-gray-500">
        Not a member?{" "}
        <a
          href="#"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Start a 14 day free trial
        </a>
      </p>

      {/* Social Login */}
      
    </div>
  );
}