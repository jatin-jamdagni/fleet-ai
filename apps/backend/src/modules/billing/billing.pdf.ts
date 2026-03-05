// We generate a clean HTML string and convert to PDF response
// Using built-in approach — no heavy dependencies needed

export interface InvoiceData {
  id:           string;
  generatedAt:  Date;
  status:       string;
  distanceKm:   number;
  costPerKm:    number;
  totalAmount:  number;
  currency:     string;
  paidAt:       Date | null;
  tenant: {
    name: string;
    slug: string;
  };
  vehicle: {
    licensePlate: string;
    make:         string;
    model:        string;
    year:         number;
  };
  trip: {
    startTime: Date;
    endTime:   Date | null;
  };
  driver?: {
    name:  string;
    email: string;
  };
}

// ─── Generate Invoice HTML ────────────────────────────────────────────────────

export function generateInvoiceHTML(inv: InvoiceData): string {
  const fmt = (n: number) => n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    }) : "—";

  const fmtDateTime = (d: Date | null) =>
    d ? new Date(d).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) : "—";

  const duration = inv.trip.startTime && inv.trip.endTime
    ? (() => {
        const ms      = new Date(inv.trip.endTime).getTime() - new Date(inv.trip.startTime).getTime();
        const hours   = Math.floor(ms / 3_600_000);
        const minutes = Math.floor((ms % 3_600_000) / 60_000);
        return `${hours}h ${minutes}m`;
      })()
    : "—";

  const statusColor: Record<string, string> = {
    PENDING: "#f59e0b",
    PAID:    "#10b981",
    VOID:    "#ef4444",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice ${inv.id.slice(-8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 40px;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      padding: 40px 48px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .brand-icon {
      font-size: 28px;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 400;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-number {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
      color: #6366f1;
    }

    .invoice-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 8px;
      background: ${statusColor[inv.status] ?? "#64748b"};
      color: white;
    }

    /* ── Body ── */
    .body {
      padding: 40px 48px;
    }

    /* ── Party section ── */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
      padding-bottom: 36px;
      border-bottom: 2px solid #f1f5f9;
    }

    .party-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .party-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .party-detail {
      font-size: 13px;
      color: #64748b;
      line-height: 1.7;
    }

    /* ── Line items ── */
    .line-items {
      margin-bottom: 32px;
    }

    .line-items-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 10px 16px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .line-item {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      align-items: center;
    }

    .line-item-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .line-item-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .line-item-value {
      font-size: 14px;
      color: #475569;
      text-align: right;
    }

    .line-item-total {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    /* ── Totals ── */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-box {
      width: 280px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 10px;
    }

    .totals-divider {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 12px 0;
    }

    .totals-final {
      display: flex;
      justify-content: space-between;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }

    .totals-currency {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 400;
    }

    /* ── Trip details ── */
    .trip-details {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .trip-details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 16px;
    }

    .trip-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .trip-stat {
      text-align: center;
    }

    .trip-stat-value {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .trip-stat-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Footer ── */
    .footer {
      border-top: 2px solid #f1f5f9;
      padding: 24px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-note {
      font-size: 12px;
      color: #94a3b8;
    }

    .footer-brand {
      font-size: 12px;
      font-weight: 700;
      color: #6366f1;
    }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand">
          <span class="brand-icon">🚛</span>
          <div>
            <div class="brand-name">${inv.tenant.name}</div>
            <div class="brand-sub">Fleet AI Management Platform</div>
          </div>
        </div>
        <div class="party-detail" style="color:#94a3b8;">
          Generated: ${fmtDate(inv.generatedAt)}<br/>
          ${inv.paidAt ? `Paid: ${fmtDate(inv.paidAt)}` : ""}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-label">Invoice</div>
        <div class="invoice-number">#${inv.id.slice(-8).toUpperCase()}</div>
        <div><span class="status-badge">${inv.status}</span></div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Parties -->
      <div class="parties">
        <div>
          <div class="party-label">Billed To</div>
          <div class="party-name">${inv.tenant.name}</div>
          <div class="party-detail">
            Fleet Account<br/>
            ${inv.tenant.slug}.fleet
          </div>
        </div>
        <div>
          <div class="party-label">Driver</div>
          <div class="party-name">${inv.driver?.name ?? "—"}</div>
          <div class="party-detail">
            ${inv.driver?.email ?? ""}<br/>
            Vehicle: ${inv.vehicle.licensePlate}<br/>
            ${inv.vehicle.make} ${inv.vehicle.model} (${inv.vehicle.year})
          </div>
        </div>
      </div>

      <!-- Trip Stats -->
      <div class="trip-details">
        <div class="trip-details-title">Trip Summary</div>
        <div class="trip-grid">
          <div class="trip-stat">
            <div class="trip-stat-value">${Number(inv.distanceKm).toFixed(2)}</div>
            <div class="trip-stat-label">Kilometres</div>
          </div>
          <div class="trip-stat">
            <div class="trip-stat-value">${duration}</div>
            <div class="trip-stat-label">Duration</div>
          </div>
          <div class="trip-stat">
            <div class="trip-stat-value">$${fmt(inv.costPerKm)}</div>
            <div class="trip-stat-label">Rate / km</div>
          </div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          <strong>Start:</strong> ${fmtDateTime(inv.trip.startTime)}
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>End:</strong> ${fmtDateTime(inv.trip.endTime)}
        </div>
      </div>

      <!-- Line Items -->
      <div class="line-items">
        <div class="line-items-header">
          <div>Description</div>
          <div style="text-align:right">Distance</div>
          <div style="text-align:right">Rate</div>
          <div style="text-align:right">Amount</div>
        </div>
        <div class="line-item">
          <div>
            <div class="line-item-name">Fleet Transport Service</div>
            <div class="line-item-sub">
              ${inv.vehicle.make} ${inv.vehicle.model} · ${inv.vehicle.licensePlate}
            </div>
          </div>
          <div class="line-item-value">${Number(inv.distanceKm).toFixed(3)} km</div>
          <div class="line-item-value">$${fmt(inv.costPerKm)}/km</div>
          <div class="line-item-total">$${fmt(inv.totalAmount)}</div>
        </div>
      </div>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>$${fmt(inv.totalAmount)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (0%)</span>
            <span>$0.00</span>
          </div>
          <hr class="totals-divider"/>
          <div class="totals-final">
            <span>Total</span>
            <span>
              $${fmt(inv.totalAmount)}
              <span class="totals-currency"> ${inv.currency}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-note">
          Invoice ID: ${inv.id}<br/>
          This invoice was automatically generated by Fleet AI.
        </div>
        <div class="footer-brand">🚛 Fleet AI</div>
      </div>

    </div>
  </div>
</body>
</html>`;
}