"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AsciiBuilding } from "@/components/AsciiBuilding";
import { ShellFrame } from "@/components/ShellFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthLoginCreate } from "@/lib/api/generated";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";
import { setCookie } from "@/lib/cookies";

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

type FormValues = z.infer<typeof schema>;

/** Rótulo do campo com a mensagem de erro à direita, na mesma linha (não ocupa espaço extra). */
function FieldLabel({
  htmlFor,
  error,
  children,
}: {
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-4 items-center justify-between gap-3 px-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      <span role="alert" className="text-caption leading-4 text-danger">
        {error}
      </span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useAuthLoginCreate();

  const {
    register,
    handleSubmit,
    setFocus,
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
        onError: (error) => {
          // Volta o foco para a senha (selecionada) para digitar de novo.
          setFocus("password", { shouldSelect: true });
          if (!(isAxiosError(error) && error.response?.status === 401)) {
            toast.error("Não foi possível entrar agora. Tente novamente em instantes.");
          }
        },
      }
    );
  };

  // 401 = credenciais erradas; qualquer outra falha é do servidor ou da conexão (também vai em toast).
  const loginError = loginMutation.error;
  const credentialError =
    loginMutation.isError && isAxiosError(loginError) && loginError.response?.status === 401;
  const loginErrorLabel = !loginMutation.isError
    ? undefined
    : credentialError
      ? "Usuário ou senha inválidos"
      : "Falha ao entrar";

  return (
    <ShellFrame className="flex flex-col items-center justify-center">
      <main className="w-full max-w-xs">
        <AsciiBuilding className="mx-auto mb-8 w-fit" />

        <header className="text-center">
          <h1 className="text-title">ERP Imobiliária</h1>
          <p className="mt-1.5 text-body text-ink-soft">Entre para continuar.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="username" error={errors.username?.message}>
              Usuário
            </FieldLabel>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              className="h-11 rounded-full px-5"
              aria-invalid={!!errors.username || credentialError}
              {...register("username")}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="password" error={errors.password?.message ?? loginErrorLabel}>
              Senha
            </FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11 rounded-full px-5"
              aria-invalid={!!errors.password || loginMutation.isError}
              {...register("password")}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" size="lg" disabled={loginMutation.isPending} className="w-full">
              {loginMutation.isPending ? "Entrando…" : "Entrar"}
            </Button>
          </div>
        </form>
      </main>

      <p className="mt-12 text-center text-caption text-ink-faint">EVE Administradora de Imóveis</p>
    </ShellFrame>
  );
}
