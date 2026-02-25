"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function GenSelector({
  generations,
  currentGenId,
}: {
  generations: any[];
  currentGenId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("gen", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
      <label htmlFor="gen-select" className="font-semibold text-slate-700">
        기수 선택 :
      </label>
      <select
        id="gen-select"
        value={currentGenId}
        onChange={handleChange}
        className="border-slate-300 rounded-md text-sm shadow-sm focus:border-brand-main focus:ring-brand-main w-48"
      >
        {generations.map((gen) => (
          <option key={gen.id} value={String(gen.id)}>
            {gen.name} {gen.isPrimary ? "(대표)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
