"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthLoginCreate } from "@/lib/api/generated";
import { safeNextPath } from "@/lib/safe-redirect";

import { FieldLabel } from "./FieldLabel";

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

type FormValues = z.infer<typeof schema>;

/** Formulário de login: o servidor guarda os tokens em cookie HttpOnly; segue para `?next=` ou para o painel. */
export function LoginForm() {
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
        onSuccess: () => {
          // Os tokens já foram para cookies HttpOnly (o handler do Next); o corpo não traz token.
          const next = new URLSearchParams(window.location.search).get("next");
          router.push(safeNextPath(next));
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Entrar" className="space-y-5">
      <div className="space-y-2">
        <FieldLabel htmlFor="username" error={errors.username?.message}>
          Usuário
        </FieldLabel>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          autoFocus
          className="h-12 rounded-sharp border-ink/20 bg-surface px-4"
          aria-invalid={!!errors.username || credentialError}
          {...register("username")}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="password" error={errors.password?.message ?? loginErrorLabel}>
          Senha
        </FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-12 rounded-sharp border-ink/20 bg-surface px-4"
          aria-invalid={!!errors.password || loginMutation.isError}
          {...register("password")}
        />
      </div>

      <div className="pt-3">
        {/* Botão preto como os da home: o laranja é só destaque nas páginas públicas. */}
        <Button
          type="submit"
          size="lg"
          disabled={loginMutation.isPending}
          className="h-12 w-full rounded-sharp bg-ink text-label text-ink-foreground hover:bg-ink/85"
        >
          {loginMutation.isPending ? "Entrando…" : "Entrar"}
          {!loginMutation.isPending && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
