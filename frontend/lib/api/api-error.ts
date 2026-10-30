import { NextResponse } from "next/server";

import type { ErrorCodeEnum } from "@/lib/api/generated/models";

/** Erro no formato da API (`{errors: [{field, code, message}]}`): o front trata um formato só. */
export function errorResponse(status: number, code: ErrorCodeEnum, message: string): NextResponse {
  return NextResponse.json({ errors: [{ field: null, code, message }] }, { status });
}
