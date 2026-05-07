import { promises as fs } from "fs";
import path from "path";
import { Suspense } from "react";

import ImportPageClient from "./ImportPageClient";

export default function ImportPage() {
  return (
    <Suspense>
      <ImportPageContent />
    </Suspense>
  );
}

async function ImportPageContent() {
  return <ImportPageClient />;
}
