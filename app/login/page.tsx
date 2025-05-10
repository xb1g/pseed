import { LoginForm } from "@/components/login-form";
import { Layout } from "@/components/layout";

export default function LoginPage() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <LoginForm />
      </div>
    </Layout>
  );
}
