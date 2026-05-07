import { Suspense } from "react";

import ImportForm from "../../src/import/ImportForm";

export default function ImportPage() {
  return (
    <Suspense>
      <ImportPageContent />
    </Suspense>
  );
}

async function ImportPageContent() {
  return <ImportForm />;
}
