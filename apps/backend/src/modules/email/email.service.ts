import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Fleet AI <noreply@fleetai.app>";

// ─── Generic send ─────────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to:      string | string[];
  subject: string;
  html:    string;
  text?:   string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev: just log the email
    console.log(`[Email] To: ${opts.to} | Subject: ${opts.subject}`);
    return;
  }

  try {
    await getResend().emails.send({
      from:    FROM,
      to:      Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html:    opts.html,
      text:    opts.text,
    });
  } catch (err) {
    console.error("[Email] Send failed:", err);
    // Don't throw — email failure should never crash the main flow
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; font-family: 'Courier New', monospace; color: #e2e8f0; }
    .container { max-width: 600px; margin: 40px auto; background: #0a0a0a;
                 border: 1px solid #1a1a1a; }
    .header { background: #f59e0b; padding: 24px 32px; }
    .header-title { font-size: 22px; font-weight: 900; color: #000;
                    letter-spacing: -0.5px; }
    .header-sub { font-size: 12px; color: #000; opacity: 0.7;
                  letter-spacing: 2px; margin-top: 4px; }
    .body { padding: 32px; }
    .label { font-size: 10px; color: #666; letter-spacing: 3px;
             text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 15px; color: #e2e8f0; margin-bottom: 20px; font-weight: 600; }
    .highlight { color: #f59e0b; font-weight: 900; font-size: 18px; }
    .divider { border: none; border-top: 1px solid #1a1a1a;
               margin: 24px 0; }
    .btn { display: inline-block; background: #f59e0b; color: #000;
           padding: 14px 28px; font-weight: 900; font-size: 13px;
           letter-spacing: 2px; text-decoration: none;
           text-transform: uppercase; margin-top: 8px; }
    .footer { padding: 20px 32px; border-top: 1px solid #1a1a1a;
              font-size: 11px; color: #333; }
    .stat-row { display: flex; justify-content: space-between;
                padding: 10px 0; border-bottom: 1px solid #1a1a1a; }
    .stat-label { color: #666; font-size: 11px; letter-spacing: 1px; }
    .stat-value { color: #e2e8f0; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">FLEET AI</div>
      <div class="header-sub">FLEET MANAGEMENT PLATFORM</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      Fleet AI · Automated Fleet Management<br/>
      You received this because you are a member of your organisation's fleet account.
    </div>
  </div>
</body>
</html>`;
}

// ─── Invite Email ─────────────────────────────────────────────────────────────

export async function sendInviteEmail(opts: {
  to:           string;
  name:         string;
  inviterName:  string;
  tenantName:   string;
  role:         string;
  inviteUrl:    string;
}): Promise<void> {
  const html = baseTemplate(`
    <p class="label">You've been invited</p>
    <p class="value">Hi ${opts.name},</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
      <strong style="color:#e2e8f0">${opts.inviterName}</strong> has invited you to join
      <strong style="color:#f59e0b">${opts.tenantName}</strong> on Fleet AI as a
      <strong style="color:#e2e8f0">${opts.role}</strong>.
    </p>
    <hr class="divider"/>
    <p class="label">Your Role</p>
    <p class="value">${opts.role}</p>
    <p class="label">Organisation</p>
    <p class="value">${opts.tenantName}</p>
    <hr class="divider"/>
    <a href="${opts.inviteUrl}" class="btn">Accept Invitation →</a>
    <p style="color:#333;font-size:11px;margin-top:16px;">
      This link expires in 48 hours.
    </p>
  `, "Fleet AI Invitation");

  await sendEmail({
    to:      opts.to,
    subject: `You've been invited to ${opts.tenantName} on Fleet AI`,
    html,
  });
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(opts: {
  to:         string;
  name:       string;
  tenantName: string;
  loginUrl:   string;
}): Promise<void> {
  const html = baseTemplate(`
    <p class="label">Welcome to Fleet AI</p>
    <p class="value highlight">Hi ${opts.name} 👋</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
      Your organisation <strong style="color:#f59e0b">${opts.tenantName}</strong> is set up
      and ready to go. You have a <strong style="color:#e2e8f0">14-day free trial</strong>
      — no credit card required.
    </p>
    <hr class="divider"/>
    <p class="label">What's next</p>
    <div class="stat-row"><span class="stat-label">1. ADD VEHICLES</span>
      <span class="stat-value">Register your fleet</span></div>
    <div class="stat-row"><span class="stat-label">2. INVITE DRIVERS</span>
      <span class="stat-value">Set up your team</span></div>
    <div class="stat-row"><span class="stat-label">3. START TRACKING</span>
      <span class="stat-value">Driver installs mobile app</span></div>
    <div class="stat-row"><span class="stat-label">4. UPLOAD MANUALS</span>
      <span class="stat-value">Enable AI assistant</span></div>
    <hr class="divider"/>
    <a href="${opts.loginUrl}" class="btn">Open Dashboard →</a>
  `, "Welcome to Fleet AI");

  await sendEmail({
    to:      opts.to,
    subject: `Welcome to Fleet AI, ${opts.name}!`,
    html,
  });
}

// ─── Invoice Generated Email ──────────────────────────────────────────────────

export async function sendInvoiceEmail(opts: {
  to:           string;
  managerName:  string;
  invoiceId:    string;
  licensePlate: string;
  driverName:   string;
  distanceKm:   string;
  totalAmount:  string;
  currency:     string;
  pdfUrl:       string;
}): Promise<void> {
  const html = baseTemplate(`
    <p class="label">Invoice Generated</p>
    <p class="value">Trip invoice ready</p>
    <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">
      A trip has been completed and your invoice is ready.
    </p>
    <hr class="divider"/>
    <div class="stat-row">
      <span class="stat-label">INVOICE</span>
      <span class="stat-value">#${opts.invoiceId.slice(-8).toUpperCase()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">VEHICLE</span>
      <span class="stat-value">${opts.licensePlate}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">DRIVER</span>
      <span class="stat-value">${opts.driverName}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">DISTANCE</span>
      <span class="stat-value">${opts.distanceKm} km</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">AMOUNT DUE</span>
      <span class="stat-value highlight">${opts.currency} ${opts.totalAmount}</span>
    </div>
    <hr class="divider"/>
    <a href="${opts.pdfUrl}" class="btn">View Invoice →</a>
  `, "Fleet AI Invoice");

  await sendEmail({
    to:      opts.to,
    subject: `Invoice #${opts.invoiceId.slice(-8).toUpperCase()} — ${opts.currency} ${opts.totalAmount}`,
    html,
  });
}

// ─── Trip Summary Email ───────────────────────────────────────────────────────

export async function sendTripSummaryEmail(opts: {
  to:           string;
  managerName:  string;
  licensePlate: string;
  driverName:   string;
  distanceKm:   string;
  durationMin:  number;
  startTime:    Date;
  endTime:      Date;
  totalAmount:  string;
}): Promise<void> {
  const duration = opts.durationMin >= 60
    ? `${Math.floor(opts.durationMin / 60)}h ${opts.durationMin % 60}m`
    : `${opts.durationMin}m`;

  const html = baseTemplate(`
    <p class="label">Trip Completed</p>
    <p class="value">${opts.licensePlate}</p>
    <hr class="divider"/>
    <div class="stat-row">
      <span class="stat-label">DRIVER</span>
      <span class="stat-value">${opts.driverName}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">DISTANCE</span>
      <span class="stat-value">${opts.distanceKm} km</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">DURATION</span>
      <span class="stat-value">${duration}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">START</span>
      <span class="stat-value">${opts.startTime.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">END</span>
      <span class="stat-value">${opts.endTime.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">INVOICE AMOUNT</span>
      <span class="stat-value highlight">$${opts.totalAmount}</span>
    </div>
  `, "Fleet AI Trip Summary");

  await sendEmail({
    to:      opts.to,
    subject: `Trip completed — ${opts.licensePlate} · ${opts.distanceKm} km`,
    html,
  });
}

// ─── Password Reset Email ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to:       string;
  name:     string;
  resetUrl: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p class="label">Password Reset</p>
    <p class="value">Hi ${opts.name},</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
      We received a request to reset your Fleet AI password.
      Click the button below to set a new password.
    </p>
    <a href="${opts.resetUrl}" class="btn">Reset Password →</a>
    <p style="color:#333;font-size:11px;margin-top:16px;">
      This link expires in 1 hour. If you didn't request this, ignore this email.
    </p>
  `, "Fleet AI Password Reset");

  await sendEmail({
    to:      opts.to,
    subject: "Reset your Fleet AI password",
    html,
  });
}

// ─── Payment Failed Email ─────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(opts: {
  to:         string;
  name:       string;
  portalUrl:  string;
}): Promise<void> {
  const html = baseTemplate(`
    <p class="label" style="color:#ef4444">⚠️ Payment Failed</p>
    <p class="value">Hi ${opts.name},</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
      Your Fleet AI subscription payment failed. Please update your payment method
      to avoid service interruption.
    </p>
    <a href="${opts.portalUrl}" class="btn" style="background:#ef4444">
      Update Payment Method →
    </a>
  `, "Fleet AI Payment Failed");

  await sendEmail({
    to:      opts.to,
    subject: "⚠️ Fleet AI — Action required: Payment failed",
    html,
  });
}