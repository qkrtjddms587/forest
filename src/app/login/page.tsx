import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterMobileForm } from "@/components/auth/register-mobile-form";

export default async function LoginPage() {
  const organizations = await prisma.organization.findMany({
    include: { generations: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-2">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="login">로그인</TabsTrigger>
            {/* <TabsTrigger value="register">회원가입</TabsTrigger> */}
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterMobileForm organizations={organizations} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
