import { ErrorScreen } from "@/components/errors/ErrorScreen";

/** Endereço ou registro que não existe (ou que é de outra empresa). */
export default function DashboardNotFound() {
  return <ErrorScreen code={404} />;
}
