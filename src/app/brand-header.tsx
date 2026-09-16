import Image from "next/image";
import Link from "next/link";

type Props = {
  /** 로고 옆에 붙는 화면 이름 */
  section?: string;
};

export function BrandHeader({ section }: Props) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-lg"
          />
          <Image
            src="/brand/logo.png"
            alt="콕집"
            width={62}
            height={22}
            className="h-5 w-auto"
          />
        </Link>

        {section && (
          <>
            <span className="text-line">|</span>
            <span className="text-sm font-medium text-navy">{section}</span>
          </>
        )}
      </div>
    </header>
  );
}
