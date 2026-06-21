interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const pages: (number | string)[] = [];
  for (let i = 1; i <= Math.min(totalPages, 4); i++) pages.push(i);
  if (totalPages > 5) {
    pages.push("...");
    pages.push(totalPages);
  } else if (totalPages === 5) {
    pages.push(5);
  }

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm">
      <span className="text-gray-500">
        Showing {start} to {end} of {totalItems} results
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2 py-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
        >
          &lt;
        </button>
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === "number" && onPageChange?.(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${p === currentPage ? "bg-green-600 text-white" : typeof p === "number" ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 cursor-default"}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
