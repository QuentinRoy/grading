import { Suspense } from "react";

import QuestionsImportForm from "@/import/QuestionsImportForm";

export default function QuestionsImportPage() {
  return (
    <Suspense>
      <QuestionsImportForm />
    </Suspense>
  );
}
