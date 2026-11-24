export async function GET() {
  try {
    const bust = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await fetch(
      `https://raw.githubusercontent.com/aurahooe/lumen-desk/main/data/dispatch.json?nocache=${bust}`,
      { 
        cache: "no-store", 
        next: { revalidate: 0 },
        headers: { 
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        } 
      }
    );
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
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
