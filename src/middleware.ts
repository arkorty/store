import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ProtectedPaths = ["/orders"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isProtectedPath = ProtectedPaths.some((p) => pathname.startsWith(p));

	if (!isProtectedPath) {
		return NextResponse.next();
	}

	const session = request.cookies.get("session")?.value;
	if (!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Do not validate/decrypt the session, just check presence
	return NextResponse.next();
}

export const config = {
	matcher: ["/orders"],
};
