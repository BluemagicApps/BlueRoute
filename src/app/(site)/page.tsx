import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { AiEdge } from "@/components/home/ai-edge";
import { Services } from "@/components/home/services";
import { Advantage } from "@/components/home/advantage";
import { WarehouseTeaser } from "@/components/home/warehouse-teaser";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <AiEdge />
      <Services />
      <Advantage />
      <WarehouseTeaser />
    </>
  );
}
