// @ts-ignore    <-- add this
import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
// @ts-ignore    <-- add this
export async function GET(request: NextRequest, {params}: any) {
	// @ts-ignore    <-- add this
	const endpoint = params.kindeAuth;
	return handleAuth(request, endpoint);
}

