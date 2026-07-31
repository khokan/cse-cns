import RegisterPage from "@/components/modules/Auth/RegisterForm";

import { Footer } from "@/components/shared/footer";

export const dynamic = "force-dynamic";

export default async function RegisterMainPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <RegisterPage />
      </div>
      <Footer />
    </div>
  );
}
