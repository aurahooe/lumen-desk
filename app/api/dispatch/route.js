export async function GET() {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/aurahooe/lumen-desk/main/data/dispatch.json",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({
      headline: "The lamp is still on.",
      body: "Write at your desk. Keep a page private, or mark it public so it lands on the front table. Every hour this room turns over.",
      pulses: [],
    });
  }
}
