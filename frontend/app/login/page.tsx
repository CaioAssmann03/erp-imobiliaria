"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Brand } from "@/components/Brand";
import { ShellFrame } from "@/components/ShellFrame";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthLoginCreate } from "@/lib/api/generated";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";
import { setCookie } from "@/lib/cookies";
import { errorTextClass } from "@/lib/ui";

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useAuthLoginCreate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (tokens) => {
          setCookie(ACCESS_COOKIE, tokens.access, 1);
          setCookie(REFRESH_COOKIE, tokens.refresh, 7);
          const next = new URLSearchParams(window.location.search).get("next");
          router.push(next || "/");
          router.refresh();
        },
      }
    );
  };

  return (
    <ShellFrame className="flex items-center justify-center">
      <Card className="w-full max-w-sm gap-5 py-6">
        <CardHeader className="items-center text-center">
          <Brand />
          <CardTitle className="mt-4 text-title">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-body text-ink-soft">Entre com seu usuário e senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
              {errors.username && (
                <span className={errorTextClass}>{errors.username.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <span className={errorTextClass}>{errors.password.message}</span>
              )}
            </div>

            {loginMutation.isError && (
              <p className={errorTextClass}>
                Usuário ou senha inválidos. Tente novamente.
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ShellFrame>
  );
}
