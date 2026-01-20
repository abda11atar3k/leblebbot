import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Proxy GET requests to backend /connectors/* endpoints
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/connectors/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Proxy POST requests to backend /connectors/* endpoints
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/connectors/${path}${searchParams ? `?${searchParams}` : ""}`;

    let body: string | undefined;
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body || undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy POST error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Proxy DELETE requests to backend /connectors/* endpoints
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/connectors/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy DELETE error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
