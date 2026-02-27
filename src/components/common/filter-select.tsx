"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: number | string;
  name: string;
}

interface FilterSelectProps {
  placeholder: string;
  paramName: string; // 예: 'gen'
  options: Option[];
}

export function FilterSelect({
  placeholder,
  paramName,
  options,
}: FilterSelectProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentValue = searchParams.get(paramName) || "all";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value && value !== "all") {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    // 페이지를 1로 초기화 (필터 바뀌면 첫 페이지부터 봐야 하니까)
    // params.delete("page")

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[110px] h-10 bg-slate-50 border-slate-200">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={String(opt.id)}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
