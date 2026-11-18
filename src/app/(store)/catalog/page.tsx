import { Suspense } from "react";
import { CatalogView } from "@frontend/views/store/CatalogView";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8]" />}>
      <CatalogView />
    </Suspense>
  );
}
