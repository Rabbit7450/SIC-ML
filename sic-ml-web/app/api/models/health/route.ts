import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.IDS_INFERENCE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return NextResponse.json({
      service_available: false,
      status: "not_configured",
      detail: "Configura IDS_INFERENCE_URL en el servidor para consultar el servicio IDS.",
      neural_network: { status: "unknown" },
    });
  }

  try {
    const response = await fetch(`${baseUrl}/health/models`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      return NextResponse.json({
        service_available: false,
        status: "unreachable",
        detail: `El servicio IDS respondió HTTP ${response.status} en /health/models. Reinícialo con el módulo ids.inference.service.`,
        neural_network: { status: "unknown" },
      }, { status: 503 });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({
      service_available: false,
      status: "unreachable",
      detail: "No se pudo consultar el servicio de inferencia. Revisa su URL y disponibilidad.",
      neural_network: { status: "unknown" },
    });
  }
}
