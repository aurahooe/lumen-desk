export async function GET() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/aurahooe/lumen-desk/main/data/dispatch.json?t=${Date.now()}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
    );
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return Response.json({
      headline: "The lamp is still on.",
      body: "Write at your desk. Keep a page private, or mark it public so it lands on the front table. Every hour this room turns over.",
      pulses: [],
    });
  }
}
