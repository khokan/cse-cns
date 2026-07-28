"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Footer } from "@/components/shared/footer";
import { Rocket, BookOpen, Award, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const role: "TRECHOLDER" = "TRECHOLDER";
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const payload = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role,
      };

      const { data, error } = await authClient.signUp.email(payload);

      if (error) {
        toast.error(`Registration failed: ${error.message}`);
        return;
      }

      toast.success("Account created successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left Side - Benefits */}
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Start Your Learning Journey
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of trecholders and unlock your potential with guided learning paths,
                premium resources, and AI-powered support.
              </p>
            </div>

            {/* Why Join Highlights */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Rocket className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quick Start</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set up your account and access premium features instantly
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rich Content Library</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Explore thousands of curated courses and resources
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Learning Assistant</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get personalized quiz generation and learning recommendations
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0">
                  <Award className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Certificates & Progress</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track achievements and earn recognized certificates
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    JD
                  </div>
                  <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center text-xs font-bold text-success">
                    AS
                  </div>
                  <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-xs font-bold text-warning">
                    MK
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Join 10,000+ learners</p>
                  <p className="text-xs text-muted-foreground">Growing every day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex items-center">
            <Card className="w-full border-2 shadow-lg dark:border-border/50">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Create Your Account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Join our community and start learning today
                    </p>
                  </div>

                  <form action={onSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        type="text"
                        required
                        className="h-11 rounded-lg border-2 border-border/50 bg-background px-4 transition-all focus:border-primary/50 focus:shadow-sm"
                      />
                    </div>

                    {/* Email */}
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

                    {/* Password */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-foreground">
                        Password
                      </label>
                      <Input
                        id="password"
                        name="password"
                        placeholder="Create a strong password"
                        type="password"
                        required
                        className="h-11 rounded-lg border-2 border-border/50 bg-background px-4 transition-all focus:border-primary/50 focus:shadow-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        At least 8 characters with a mix of letters and numbers
                      </p>
                    </div>

                    {/* Role is fixed to trecholder for self-registration */}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-background px-2 text-muted-foreground">
                          Already have an account?
                        </span>
                      </div>
                    </div>
                  </form>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 bg-muted/30 px-8 py-4">
                <Button asChild variant="ghost" className="w-full text-base font-medium">
                  <Link href="/login">
                    Sign In
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
