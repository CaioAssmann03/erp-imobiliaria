import Link from "next/link";

const CARDS = [
  {
    href: "/condominios",
    title: "Condomínios",
    description: "Cadastro de condomínios, blocos e unidades.",
  },
  {
    href: "/pessoas",
    title: "Pessoas",
    description: "Cadastro de proprietários, locatários e demais pessoas.",
  },
];

export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Painel
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Administração de condomínios, locações, vendas e financeiro.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <h2 className="mb-1 font-medium text-zinc-900 dark:text-zinc-50">
              {card.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
