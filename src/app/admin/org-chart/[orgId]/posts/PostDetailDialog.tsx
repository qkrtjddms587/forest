"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface PostImage {
  url: string;
}

interface PostData {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  author?: {
    name: string;
    company?: string | null;
  };
  images?: PostImage[];
}

interface Props {
  post: PostData;
  isHidden: boolean;
}

export function PostDetailDialog({ post, isHidden }: Props) {
  return (
    <Dialog>
      {/* 🌟 테이블의 제목 부분을 클릭하면 모달이 열리도록 Trigger 설정 */}
      <DialogTrigger asChild>
        <button
          className={`text-left font-medium truncate max-w-md hover:underline hover:text-blue-600 transition-colors w-full ${
            isHidden ? "text-slate-400 line-through" : ""
          }`}
        >
          {post.title}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* 상단 헤더 영역 (고정) */}
        <div className="p-6 pb-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-2 mb-3">
            {post.type === "NOTICE" && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                공지
              </Badge>
            )}
            {post.type === "GALLERY" && (
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                갤러리
              </Badge>
            )}
            {post.type === "ADS" && (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-purple-100 border-none">
                홍보
              </Badge>
            )}
            {post.type === "FREE" && (
              <Badge variant="outline" className="text-slate-500 font-normal">
                자유
              </Badge>
            )}
            {isHidden && <Badge variant="secondary">숨김 처리됨</Badge>}
          </div>

          <DialogTitle className="text-2xl font-bold leading-snug">
            {post.title}
          </DialogTitle>

          <div className="flex items-center gap-4 text-sm text-slate-500 mt-4">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="font-medium text-slate-700">
                {post.author?.name || "알 수 없음"}
              </span>
              {post.author?.company && (
                <span className="text-slate-400">({post.author.company})</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.createdAt).toLocaleString("ko-KR")}</span>
            </div>
          </div>
        </div>

        {/* 본문 및 사진 영역 (스크롤) */}
        <div className="p-6 overflow-y-auto bg-slate-50/30">
          {/* 첨부된 이미지가 있다면 먼저 쫙 뿌려줍니다 */}
          {post.images && post.images.length > 0 && (
            <div className="flex flex-col gap-4 mb-8">
              {post.images.map((img, idx) => (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`첨부 이미지 ${idx + 1}`}
                    className="w-full h-auto object-contain max-h-[600px]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 🌟 줄바꿈(\n)을 그대로 인식해서 렌더링하는 본문 영역 */}
          <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base min-h-[200px]">
            {post.content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
