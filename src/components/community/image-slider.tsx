"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageSliderProps {
  images: { url: string }[];
}

export function ImageSlider({ images }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchOffset, setTouchOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 이미지가 없으면 아무것도 렌더링하지 않음
  if (!images || images.length === 0) return null;

  // 🌟 환경 변수 로직 (Client Component용)
  const s3Domain = process.env.NEXT_PUBLIC_S3_DOMAIN || "";
  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "";

  // 🌟 URL 조립 함수 (슬래시 중복 및 누락 방지)
  const getFullUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${s3Domain}/${s3Bucket}${cleanPath}`;
  };

  const nextSlide = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    setTouchOffset(0);
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    setTouchOffset(0);
  };

  // 🌟 모바일 터치 스와이프 및 드래그 로직
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentTouchX = e.targetTouches[0].clientX;
    const diff = currentTouchX - touchStart;

    // 첫 장이나 마지막 장에서 넘기려 할 때 저항감 부여
    if (
      (currentIndex === 0 && diff > 0) ||
      (currentIndex === images.length - 1 && diff < 0)
    ) {
      setTouchOffset(diff * 0.3);
    } else {
      setTouchOffset(diff);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    // 70px 이상 밀었을 때만 슬라이드 전환 실행
    if (touchOffset < -70) nextSlide();
    else if (touchOffset > 70) prevSlide();
    else setTouchOffset(0);
  };

  return (
    <div className="relative w-full mb-8 group overflow-hidden rounded-sm touch-none select-none">
      {/* 🌟 실제 슬라이드 애니메이션이 일어나는 컨테이너 */}
      <div
        className="flex w-full aspect-video bg-slate-100/50 transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(calc(-${
            currentIndex * 100
          }% + ${touchOffset}px))`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, idx) => (
          <div key={idx} className="relative w-full h-full flex-shrink-0">
            <Image
              src={getFullUrl(img.url)}
              alt={`게시글 이미지 ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {/* 🌟 좌우 버튼 (데스크톱 전용) */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => prevSlide()}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              type="button"
              onClick={() => nextSlide()}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* 하단 페이지 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? "w-6 bg-brand-main"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
