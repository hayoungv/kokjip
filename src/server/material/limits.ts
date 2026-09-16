/**
 * 학습 자료를 판정에 넣기 전에 재는 분량의 상한.
 *
 * 값이 분량에 비례해 든다. 상한을 넘으면 그대로 넣지 않고
 * 목차가 있는 쪽을 고르도록 강사에게 되돌린다.
 * 기준은 원가 모형 10장이다.
 */

/** 글자 상한. 100쪽 남짓이며 약 800원이 든다. */
export const MAX_TEXT_CHARS = 80_000;

/** 사진 장수 상한. */
export const MAX_IMAGES = 20;

/** 파일 하나의 크기 상한. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** 한 번에 올릴 수 있는 파일 수. */
export const MAX_FILES = 20;
