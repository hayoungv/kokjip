import Image from "next/image";
import Link from "next/link";

/**
 * 학습자 화면을 감싸는 휴대폰 틀.
 *
 * 학습자가 쓰는 것은 안드로이드 앱이다. 웹에서 볼 때도 앱에서 보이는
 * 모양 그대로 보이도록 화면 너비를 휴대폰만큼으로 묶고 틀을 씌운다.
 * 틀 자체는 보여 주기 위한 것이고 앱에는 들어가지 않는다.
 */

type Props = {
  /** 앱 화면 상단에 붙는 이름 */
  section: string;
  /** 뒤로 가는 곳. 없으면 뒤로 가기가 나오지 않는다 */
  back?: string;
  children: React.ReactNode;
};

export function PhoneFrame({ section, back, children }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <p className="mb-4 text-xs text-muted">
        학습자가 보는 화면입니다. 실제로는 안드로이드 앱입니다.
      </p>

      <div className="w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border-[10px] border-deep-navy bg-canvas shadow-2xl">
        {/* 상태 표시줄 */}
        <div className="flex items-center justify-between bg-deep-navy px-6 pb-2 pt-1 text-[11px] font-medium text-white/80">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span aria-hidden>●●●</span>
            <span aria-hidden>▮</span>
          </span>
        </div>

        {/* 앱 상단 막대 */}
        <div className="flex items-center gap-2.5 border-b border-line bg-surface px-4 py-3">
          {back ? (
            <Link
              href={back}
              aria-label="뒤로"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-navy"
            >
              <span aria-hidden>‹</span>
            </Link>
          ) : (
            <Image
              src="/brand/icon.png"
              alt=""
              width={24}
              height={24}
              className="shrink-0 rounded-md"
            />
          )}
          <span className="truncate text-sm font-semibold text-navy">
            {section}
          </span>
        </div>

        {/* 앱 본문 */}
        <div className="h-[680px] overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>

        {/* 아래쪽 손잡이 */}
        <div className="flex justify-center bg-surface py-2">
          <span className="h-1 w-28 rounded-full bg-line" />
        </div>
      </div>

      <Link href="/" className="mt-5 text-xs text-muted hover:text-navy">
        콕집 홈으로
      </Link>
    </div>
  );
}
