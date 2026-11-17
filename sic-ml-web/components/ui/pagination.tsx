"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Paginación de tablas: muestra `pageSize` filas por página (4–6 recomendado).
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2" aria-label="Paginación de la tabla">
      <p className="text-xs text-muted">
        Página {current} de {pages} · {total} registros · {pageSize} por página
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={current >= pages}
          onClick={() => onPage(current + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
