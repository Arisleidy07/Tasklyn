import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { email, listName, inviterName, role, token } = await request.json();

  if (!email || !listName || !inviterName || !token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/invite/${token}`;

  try {
    await resend.emails.send({
      from: "TASKLYN <noreply@tasklyn.app>",
      to: email,
      subject: `${inviterName} te invitó a colaborar en TASKLYN`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invitación a TASKLYN</title>
          </head>
          <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6);padding:32px;text-align:center;">
                        <div style="display:inline-flex;align-items:center;gap:10px;">
                          <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                            <span style="color:white;font-weight:900;font-size:18px;">T</span>
                          </div>
                          <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">TASKLYN</span>
                        </div>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
                          Te invitaron a colaborar
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                          <strong style="color:#111827;">${inviterName}</strong> te invitó a unirte a la lista
                          <strong style="color:#2563eb;">"${listName}"</strong> en TASKLYN como
                          <strong style="color:#111827;">${role === "editor" ? "Editor" : "Viewer"}</strong>.
                        </p>

                        <!-- Role badge -->
                        <div style="display:inline-block;padding:6px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;margin-bottom:28px;">
                          <span style="font-size:13px;font-weight:600;color:#2563eb;">
                            Rol: ${role === "editor" ? "Editor (puede editar)" : "Viewer (solo lectura)"}
                          </span>
                        </div>

                        <!-- CTA -->
                        <div style="text-align:center;margin-bottom:32px;">
                          <a href="${inviteUrl}"
                            style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">
                            Aceptar invitación →
                          </a>
                        </div>

                        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                          Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">
                          © ${new Date().getFullYear()} TASKLYN · Gestión de tareas colaborativa
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
