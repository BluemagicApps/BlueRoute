import type { Metadata } from "next";
import { WarehouseExplorer } from "@/components/warehouse/warehouse-explorer";

export const metadata: Metadata = {
  title: "Warehouse Leasing",
  description:
    "Search Blue Route's network of smart warehouses — filter by location, size, and features, see live leasing estimates, and get AI-matched to your best-fit facility.",
};

export default function WarehousingPage() {
  return <WarehouseExplorer />;
}
