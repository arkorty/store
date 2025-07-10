import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const url = searchParams.get("url");
	if (!url) {
		return new Response(JSON.stringify({ error: "Missing url param" }), { status: 400 });
	}
	if (!url.startsWith("https://files.stripe.com/")) {
		return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
	}

	const response = await fetch(url);
	if (!response.ok) {
		return new Response(null, { status: response.status });
	}

	const headers = new Headers(response.headers);
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Cache-Control", "public, max-age=3600");

	return new Response(response.body, {
		status: response.status,
		headers,
	});
}
