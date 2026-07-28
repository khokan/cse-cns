
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2, Zap, Users, BarChart3, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const { data, error } = await authClient.signIn.email({ email, password });

      if (error) {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("email not verified") || msg.includes("email_not_verified") || msg.includes("verify your email")) {
          toast.error("Email not verified");
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
        return;
      }

      if (data?.user && !data.user.emailVerified) {
        toast.error("Email not verified");
        return;
      }

      toast.success("Welcome back!");
      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left Side - Features & Benefits */}
            <div className="flex flex-col justify-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Welcome Back
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Access your learning dashboard and continue your journey to success.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Personalized Learning Paths</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tailored courses designed for your goals
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0">
                    <Zap className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI-Powered Quizzes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Smart assessments to test your knowledge
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Expert Community</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Learn from instructors and peers
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0">
                    <BarChart3 className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Progress Analytics</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track your learning metrics in real-time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center">
              <Card className="w-full border-2 shadow-lg dark:border-border/50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Enter your credentials to access your account
                      </p>
                    </div>

                    <form action={onSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                          Email Address
                        </label>
                        <Input
                          id="email"
                          name="email"
                          placeholder="you@example.com"
                          type="email"
                          required
                          className="h-11 rounded-lg border-2 border-border/50 bg-background px-4 transition-all focus:border-primary/50 focus:shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="password" className="text-sm font-medium text-foreground">
                            Password
                          </label>
                          <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          name="password"
                          placeholder="••••••••"
                          type="password"
                          required
                          className="h-11 rounded-lg border-2 border-border/50 bg-background px-4 transition-all focus:border-primary/50 focus:shadow-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Signing in...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Sign In
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-background px-2 text-muted-foreground">
                          New to CSE?
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/50 bg-muted/30 px-8 py-4">
                  <Button asChild variant="ghost" className="w-full text-base font-medium">
                    <Link href="/register">
                      Create an account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
    </>
  );
}

export const signInWithGoogle = async (next: string = "/dashboard") => {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return await authClient.signIn.social({
    provider: "google",
    callbackURL: `${origin}${next.startsWith("/") ? next : "/dashboard"}`,
  });
};
