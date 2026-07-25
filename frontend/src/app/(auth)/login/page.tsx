import LoginPage from "@/components/modules/login/login-form";

import { Footer } from "@/components/shared/footer";
import Navbar from "@/components/shared/navbar";

export const dynamic = "force-dynamic";

export default async function LoginDash() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <LoginPage />
      </div>
      <Footer />
    </div>
  );
}
