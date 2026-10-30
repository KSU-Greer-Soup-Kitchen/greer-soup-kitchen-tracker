// Every gift as a spreadsheet file (opens in Excel or Google Sheets). Staff only.

import { getStaff } from "../../../../../lib/auth";
import { listDonations } from "../../../../../lib/staff-data";
import { labelFor, PAYMENT_METHODS } from "../../../../../lib/options";
import { toCsv } from "../../../../../lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getStaff())) {
    return new Response("Please log in first.", { status: 401 });
  }
  const gifts = await listDonations();
  const rows = gifts.map((d) => [
    d.donated_at.slice(0, 10),
    [d.people?.first_name, d.people?.last_name].filter(Boolean).join(" "),
    d.people?.email ?? "",
    Number(d.amount).toFixed(2),
    labelFor(PAYMENT_METHODS, d.payment_method) || "Not recorded",
    d.source === "paypal" ? "PayPal (automatic)" : "Typed in by staff",
    d.tribute_type && d.tribute_name ? `In ${d.tribute_type} of ${d.tribute_name}` : "",
    d.notes ?? "",
  ]);
  const csv = toCsv(["Date", "Name", "Email", "Amount", "How paid", "Added by", "Tribute", "Note"], rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="greer-soup-kitchen-gifts.csv"',
      "Cache-Control": "no-store",
    },
  });
}
