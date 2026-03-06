import { getTranslations } from "next-intl/server";

export default async function InfoPage() {
  const t = await getTranslations("info");

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="font-mono text-[11px] text-text-muted mt-1">{t("subtitle")}</p>
          <p className="text-sm text-text-muted mt-3 leading-relaxed">{t("description")}</p>
        </div>

        <Section title={t("architecture.title")}>
          <CodeList items={[
            t("architecture.backend"),
            t("architecture.broker"),
            t("architecture.db"),
            t("architecture.frontend"),
          ]} />
        </Section>

        <Section title={t("quickstart.title")}>
          <ol className="flex flex-col gap-2">
            {[
              t("quickstart.step1"),
              t("quickstart.step2"),
              t("quickstart.step3"),
              t("quickstart.step4"),
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono text-[10px] w-5 h-5 shrink-0 rounded border border-border bg-surface-hi flex items-center justify-center text-text-muted mt-0.5">
                  {i + 1}
                </span>
                <span className="font-mono text-[12px] text-text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t("topics.title")}>
          <CodeList items={[
            t("topics.status"),
            t("topics.pos"),
            t("topics.env"),
            t("topics.log"),
            t("topics.cmd"),
          ]} />
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CodeList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="font-mono text-[12px] text-text-muted bg-bg border border-border rounded-md px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}
