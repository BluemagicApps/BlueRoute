import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const ROW_KEYS = ["eta", "disruptions", "quoting", "visibility", "warehousing"] as const;

export async function Advantage() {
  const t = await getTranslations("Home.advantage");

  return (
    <section className="relative py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("title")} <span className="text-mist">{t("titleLegacy")}</span> {t("titleAnd")}{" "}
              <span className="text-gradient">{t("titleAccent")}</span>
            </>
          }
          subtitle={t("subtitle")}
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-3xl border border-steel/50">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-steel/50 bg-deep/60">
              <div className="p-5 text-sm font-medium text-mist">{t("headerCapability")}</div>
              <div className="p-5 text-sm font-semibold text-mist/80">
                {t("headerLegacy")}
              </div>
              <div className="relative p-5 text-sm font-semibold text-cyan">
                <span className="absolute inset-0 bg-cyan/5" />
                <span className="relative">{t("headerBlue")}</span>
              </div>
            </div>

            {ROW_KEYS.map((key, i) => (
              <div
                key={key}
                className={`grid grid-cols-3 items-center ${
                  i !== ROW_KEYS.length - 1 ? "border-b border-steel/40" : ""
                }`}
              >
                <div className="p-5 text-sm font-medium text-foam">{t(`rows.${key}.label`)}</div>
                <div className="flex items-start gap-2 p-5 text-sm text-mist">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-mist/50" />
                  {t(`rows.${key}.legacy`)}
                </div>
                <div className="relative flex items-start gap-2 p-5 text-sm text-foam">
                  <span className="absolute inset-0 bg-cyan/5" />
                  <Check className="relative mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  <span className="relative">{t(`rows.${key}.blue`)}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
