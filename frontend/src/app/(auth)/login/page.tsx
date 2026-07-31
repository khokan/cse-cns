import LoginPage from "@/components/modules/login/login-form";

import { Footer } from "@/components/shared/footer";

export const dynamic = "force-dynamic";

export default async function LoginDash() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <LoginPage />
      </div>
      <Footer />
    </div>
  );
}
