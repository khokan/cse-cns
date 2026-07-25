import RegisterPage from "@/components/modules/Auth/RegisterForm";

import { Footer } from "@/components/shared/footer";
import Navbar from "@/components/shared/navbar";

export const dynamic = "force-dynamic";

export default async function RegisterMainPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <RegisterPage />
      </div>
      <Footer />
    </div>
  );
}
