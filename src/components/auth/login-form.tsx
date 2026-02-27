"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // 🌟 라우터 임포트
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle } from "lucide-react"; // 🌟 에러 아이콘용 (선택)

const loginSchema = z.object({
  loginId: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export function LoginForm() {
  const router = useRouter(); // 🌟 라우터 초기화

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: "", password: "" },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    // 🌟 redirect: false 로 변경!
    const result = await signIn("credentials", {
      loginId: data.loginId,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      // 🌟 실패 시: form 전체(root)에 에러 메시지 세팅
      form.setError("root", {
        type: "manual",
        message: "아이디 또는 비밀번호가 일치하지 않습니다.",
      });
    } else if (result?.ok) {
      // 🌟 성공 시: 개발자가 직접 수동으로 리다이렉트
      router.push("/");
      router.refresh(); // 세션 정보를 새로고침해서 레이아웃 등에 즉시 반영
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 px-4 py-6"
      >
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>아이디</FormLabel>
              <FormControl>
                <Input placeholder="아이디" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="비밀번호"
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 🌟 폼 전체 에러 메시지 출력 영역 */}
        {form.formState.errors.root && (
          <div className="flex items-center gap-2 p-3 mt-2 text-sm font-semibold text-red-600 bg-red-50 rounded-md border border-red-100">
            <AlertCircle className="w-4 h-4" />
            {form.formState.errors.root.message}
          </div>
        )}

        {/* 로딩 상태일 때 버튼 비활성화 처리 추가 */}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold mt-6"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </Form>
  );
}
