import PDFDocument from "pdfkit";
import type { Proposal, ProposalItem } from "@/types";

const money = (n: number | null) =>
  n == null ? "-" : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Customer-facing proposal PDF. Only priced, non-flagged items appear - flagged
// lines are held back for Marcus, exactly like the emailed text version.
export function buildProposalPdf(
  proposal: Proposal,
  items: ProposalItem[],
  customerName: string
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const brand = "#1f6d3b";
  const left = 50;
  const right = 545;

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill(brand);
  doc.fillColor("white").fontSize(22).font("Helvetica-Bold").text("Greenscape Pro", left, 30);
  doc.fontSize(10).font("Helvetica").text("Premium Outdoor Living - Phoenix, AZ", left, 58);
  doc.fillColor("black");

  doc.moveDown(4);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.fontSize(16).font("Helvetica-Bold").text("Project Proposal", left, 120);
  doc.fontSize(10).font("Helvetica").fillColor("#555")
    .text(`Prepared for: ${customerName}`, left, 145)
    .text(proposal.project_name ? `Project: ${proposal.project_name}` : "", left)
    .text(`Date: ${dateStr}`, left);
  doc.fillColor("black");

  const section = (title: string) => {
    doc.moveDown(1);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(brand).text(title);
    doc.fillColor("black").font("Helvetica").fontSize(10);
    doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor("#ddd").stroke();
    doc.moveDown(0.5);
  };

  if (proposal.ai_summary) {
    section("Project Overview");
    doc.text(proposal.ai_summary, { width: right - left });
  }

  // Scope + pricing (customer-facing: priced, non-flagged only)
  section("Scope of Work & Investment");
  const priced = items.filter((i) => i.line_total != null && !i.needs_review);
  const rowY = () => doc.y;
  doc.font("Helvetica-Bold").fontSize(9);
  let y = rowY();
  doc.text("Item", left, y, { width: 250 });
  doc.text("Qty", left + 260, y, { width: 60 });
  doc.text("Unit", left + 320, y, { width: 80 });
  doc.text("Total", left + 400, y, { width: 95, align: "right" });
  doc.moveDown(0.3);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ddd").stroke();
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9);
  if (priced.length === 0) {
    doc.fillColor("#999").text("Final line items pending confirmation.", left).fillColor("black");
  }
  for (const i of priced) {
    y = rowY();
    doc.text(i.description, left, y, { width: 250 });
    doc.text(`${i.quantity ?? ""} ${i.unit ?? ""}`.trim(), left + 260, y, { width: 60 });
    doc.text(money(i.unit_price), left + 320, y, { width: 80 });
    doc.text(money(i.line_total), left + 400, y, { width: 95, align: "right" });
    doc.moveDown(0.4);
  }
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ddd").stroke();
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text(`Total: ${money(proposal.total)}`, left, doc.y, { width: right - left, align: "right" });
  doc.font("Helvetica").fontSize(10);

  const bullets = (title: string, arr: string[]) => {
    if (!arr || arr.length === 0) return;
    section(title);
    for (const a of arr) doc.text(`•  ${a}`, left, doc.y, { width: right - left });
  };
  bullets("Assumptions", proposal.assumptions);
  bullets("Exclusions", proposal.exclusions);
  bullets("Optional Add-ons (not included in the total above)", proposal.potential_addons);

  section("Next Steps");
  doc.text(
    "Reply to approve this proposal and we'll schedule your build. Questions or adjustments? Just let us know - we're happy to walk through the details.",
    { width: right - left }
  );

  doc.moveDown(2);
  doc.fontSize(8).fillColor("#999").text("Greenscape Pro - This proposal is valid for 30 days.", left, doc.y, {
    width: right - left,
    align: "center",
  });

  doc.end();
  return done;
}
