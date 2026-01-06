// Logica del backend para verificar el token de google
const CLIENT_ID =
  "934272342967-it58ahq1jmjt347vm7t1mopi7hnql9dl.apps.googleusercontent.com"; // --ID de google cloud
import { OAuth2Client } from "google-auth-library"; //-- libreria para verificar el token
import { NextResponse } from "next/server";

interface GooglePayload {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.token) {
    const response = NextResponse.json(
      { message: "Token no enviado" },
      { status: 400 }
    );
  }
  const client = new OAuth2Client(CLIENT_ID);

  try {
    // 1. Verificar token con Google
    const ticket = await client.verifyIdToken({
      idToken: body.token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload() as GooglePayload;

    if (!payload?.email) {
      return NextResponse.json(
        {
          message: "Google no retornó correo",
        },
        { status: 400 }
      );
    }

    // 2. Consultar a tu backend
    const backendRes = await fetch(
      "https://harol-lovers.up.railway.app/auth/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: payload.email }),
      }
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          registered: false,
          message: "Cuenta no registrada",
        },
        { status: 404 }
      );
    }

    // 3. Login correcto
    return NextResponse.json({
      ok: true,
      email: payload.email,
      nombre: payload.name,
      username: data.usuario.username,
      token: data.token,
      role: data.usuario.role,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 400,
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 400 }
    );
  }
}
