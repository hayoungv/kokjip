import { tocToText } from "@/domain/toc";
import { readInstructorView } from "@/server/api/instructor";
import { BrandHeader } from "../../../brand-header";
import { MaterialForm } from "./material-form";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await readInstructorView(token);

  if (!view || !view.consentedAt) {
    return (
      <>
        <BrandHeader section="강사" />
        <main className="mx-auto w-full max-w-lg flex-1 px-6 py-20">
          <h1 className="text-xl font-bold text-navy">이 화면은 열리지 않습니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            주소가 잘못되었거나, 아직 녹음 허용에 동의하지 않으셨습니다.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <BrandHeader section="강사" />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <MaterialForm
          token={token}
          savedToc={tocToText(view.toc)}
          savedCount={view.toc.length}
        />
      </main>
    </>
  );
}
