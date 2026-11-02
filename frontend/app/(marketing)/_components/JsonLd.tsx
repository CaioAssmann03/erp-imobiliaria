/** Dados estruturados (schema.org) de uma página pública, como `<script type="application/ld+json">`. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // `<` escapado para que nenhum texto do objeto feche o <script>.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
