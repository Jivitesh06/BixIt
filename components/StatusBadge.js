import { getStatusStyle } from "@/lib/utils";

export default function StatusBadge({ status }) {
  const { label, color } = getStatusStyle(status);
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize inline-block ${color}`}>
      {label}
    </span>
  );
}
