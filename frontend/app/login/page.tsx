"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthLoginCreate } from "@/lib/api/generated";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api-client";
import { setCookie } from "@/lib/cookies";
import {
  buttonPrimaryClass,
  errorTextClass,
  fieldWrapClass,
  inputClass,
  labelClass,
} from "@/lib/ui";

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          ERP Imobiliária
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Entre com seu usuário e senha.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className={fieldWrapClass}>
            <label htmlFor="username" className={labelClass}>
              Usuário
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className={inputClass}
              {...register("username")}
            />
            {errors.username && (
              <span className={errorTextClass}>{errors.username.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
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

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className={`${buttonPrimaryClass} w-full`}
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
