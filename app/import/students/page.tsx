import { Suspense } from "react";

import StudentsImportForm from "@/import/StudentsImportForm";

export default function StudentsImportPage() {
  return (
    <Suspense>
      <StudentsImportForm />
    </Suspense>
  );
}
