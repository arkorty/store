"use server";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

if (!process.env.SECRET) {
	throw new Error("SECRET must be defined");
}

const key = new TextEncoder().encode(process.env.SECRET);
const SessionDuration = 24 * 60 * 60 * 1000;

interface User {
	email: string;
}

interface SessionData extends JWTPayload {
	user: User;
	expires: number;
}

export async function encrypt(payload: SessionData): Promise<string> {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(payload.expires)
		.sign(key);
}

export async function decrypt(input: string): Promise<SessionData | null | undefined> {
	try {
		const r = await jwtVerify(input, key, {
			algorithms: ["HS256"],
		});
		return r.payload as SessionData;
	} catch (e) {
		if (e instanceof Error) {
			console.log(e.message);
		}
	}
}

export async function login(_state: unknown, formData: FormData): Promise<{ error?: string } | undefined> {
	"use server";

	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	// If session already exists, skip login
	if ((await cookies()).get("session")?.value) {
		redirect("/orders");
		return;
	}

	const res = await fetch("https://fakestoreapi.com/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});

	if (!res.ok) {
		return { error: "Invalid credentials" };
	}

	const data = (await res.json()) as { token?: string };
	if (!data.token) {
		return { error: "Invalid credentials" };
	}

	const expires = Date.now() + SessionDuration;
	(await cookies()).set("session", data.token, {
		expires: new Date(expires),
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	redirect("/orders");
	return;
}

export async function logout() {
	"use server";
	(await cookies()).delete("session");
	redirect("/login");
}

export async function auth() {
	const session = (await cookies()).get("session")?.value;
	if (!session) return null;

	const data = await decrypt(session);
	if (!data || data.expires < Date.now()) {
		(await cookies()).delete("session");
		return null;
	}

	return data;
}

export async function updateSession(request: NextRequest) {
	const session = (await cookies()).get("session")?.value;
	if (!session) return;

	const data = await decrypt(session);
	if (!data) return;

	if (data.expires - Date.now() < 60 * 60 * 1000) {
		data.expires = Date.now() + SessionDuration;

		const res = NextResponse.next();
		res.cookies.set({
			name: "session",
			value: await encrypt(data),
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			expires: new Date(data.expires),
		});
		return res;
	}

	return NextResponse.next();
}
