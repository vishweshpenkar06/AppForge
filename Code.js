const pptxgen = require("pptxgenjs");

// ============================================================= PALETTE
const C = {
  navy: "1E2761",
  navyDeep: "141B47",
  ice: "CADCFC",
  iceSoft: "EAF0FD",
  white: "FFFFFF",
  teal: "00B4A6",
  gold: "D4AC0D",
  ink: "1B1F3B",
  gray: "5B6178",
  lightGray: "F4F6FB",
  line: "D9E0F2",
  green: "27AE60",
  amber: "E8A33D",
  red: "E0554A",
  blue: "3A5FCD",
  purple: "9B59B6",
};

// module colors (match ER legend concept)
const MOD = {
  org: C.blue,
  prod: C.green,
  supply: C.amber,
  sales: C.purple,
  fin: C.red,
  hr: C.teal,
  mfg: C.gold,
};

const FONT_HEAD = "Arial";
const FONT_BODY = "Calibri";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const PGW = 13.33, PGH = 7.5;

// ============================================================= HELPERS

function bg(slide, color) {
  slide.background = { color };
}

function pageNum(slide, n, dark) {
  slide.addText(String(n).padStart(2, "0"), {
    x: PGW - 0.9, y: PGH - 0.45, w: 0.6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: dark ? C.ice : C.gray,
    align: "right", margin: 0,
  });
}

function kicker(slide, text, color, x, y) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 6, h: 0.35, fontFace: FONT_BODY, bold: true,
    fontSize: 12, color: color, charSpacing: 2, margin: 0,
  });
}

// small stacked-rectangle "server / db" motif icon
function dbIcon(slide, x, y, size, color, accent) {
  const w = size, barH = size * 0.22, gap = size * 0.07;
  for (let i = 0; i < 3; i++) {
    slide.addShape("roundRect", {
      x: x, y: y + i * (barH + gap), w: w, h: barH,
      rectRadius: 0.04, fill: { color: i === 1 ? (accent || color) : color },
      line: { type: "none" },
    });
    // little dots to suggest ports
    slide.addShape("ellipse", {
      x: x + w - barH * 0.9, y: y + i * (barH + gap) + barH * 0.28, w: barH * 0.36, h: barH * 0.36,
      fill: { color: C.white }, line: { type: "none" },
    });
  }
}

function statusChip(slide, x, y, label, color) {
  const w = 1.9, h = 0.34;
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.08, fill: { color: color }, line: { type: "none" },
  });
  slide.addText(label, {
    x, y, w, h, align: "center", valign: "middle", fontFace: FONT_BODY,
    bold: true, fontSize: 11, color: C.white, margin: 0,
  });
}

function sectionHeader(slide, num, title) {
  bg(slide, C.navy);
  dbIcon(slide, 0.9, 0.9, 0.55, C.teal, C.gold);
  slide.addText(`SECTION ${num}`, {
    x: 0.9, y: 2.55, w: 8, h: 0.4, fontFace: FONT_BODY, bold: true,
    fontSize: 14, color: C.teal, charSpacing: 3, margin: 0,
  });
  slide.addText(title, {
    x: 0.85, y: 2.95, w: 11.5, h: 1.6, fontFace: FONT_HEAD, bold: true,
    fontSize: 40, color: C.white, margin: 0,
  });
  slide.addShape("line", {
    x: 0.9, y: 4.7, w: 2.4, h: 0, line: { color: C.teal, width: 2.5 },
  });
}

function title(slide, t, sub) {
  slide.addText(t, {
    x: 0.7, y: 0.5, w: 11.9, h: 0.75, fontFace: FONT_HEAD, bold: true,
    fontSize: 30, color: C.navy, margin: 0,
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.7, y: 1.18, w: 11.9, h: 0.4, fontFace: FONT_BODY, fontSize: 13.5,
      color: C.gray, margin: 0,
    });
  }
  slide.addShape("ellipse", {
    x: 12.55, y: 0.58, w: 0.14, h: 0.14, fill: { color: C.teal }, line: { type: "none" },
  });
}

function footerBrand(slide, dark) {
  slide.addText("ERP DATABASE MANAGEMENT  |  TEAM TEEN KABIL TALWARBAZZ", {
    x: 0.7, y: PGH - 0.45, w: 8, h: 0.3, fontFace: FONT_BODY, fontSize: 8.5,
    color: dark ? "8891BE" : "AEB4CC", charSpacing: 1, margin: 0,
  });
}

// ============================================================= SLIDE 1 — TITLE
{
  const s = pptx.addSlide();
  bg(s, C.navy);
  // decorative right panel
  s.addShape("rect", { x: 8.9, y: 0, w: 4.43, h: PGH, fill: { color: C.navyDeep }, line: { type: "none" } });

  dbIcon(s, 9.75, 1.0, 1.5, C.teal, C.gold);
  dbIcon(s, 11.3, 3.2, 1.0, C.ice, C.teal);
  dbIcon(s, 9.9, 4.7, 0.75, C.gold, C.teal);

  s.addText("29 TABLES  ·  7 MODULES  ·  1 ERP", {
    x: 9.3, y: 6.35, w: 3.7, h: 0.5, fontFace: FONT_BODY, fontSize: 10.5,
    color: C.ice, align: "center", charSpacing: 1.5, margin: 0,
  });

  kicker(s, "Database Management System Project", C.teal, 0.85, 1.55);
  s.addText("ERP Database\nManagement", {
    x: 0.8, y: 2.0, w: 7.9, h: 2.1, fontFace: FONT_HEAD, bold: true,
    fontSize: 46, color: C.white, lineSpacing: 50, margin: 0,
  });
  s.addText("Schema Design, SQL Analytics & Business Intelligence for a\nMulti-Company Enterprise Resource Planning Platform", {
    x: 0.85, y: 4.05, w: 7.6, h: 0.8, fontFace: FONT_BODY, fontSize: 14.5,
    color: C.ice, lineSpacing: 20, margin: 0,
  });

  s.addShape("roundRect", {
    x: 0.85, y: 5.15, w: 7.6, h: 1.55, rectRadius: 0.08,
    fill: { color: C.navyDeep }, line: { color: "2B3576", width: 1 },
  });
  s.addText("PRESENTED BY  ·  TEAM TEEN KABIL TALWARBAZZ", {
    x: 1.15, y: 5.32, w: 7, h: 0.3, fontFace: FONT_BODY, bold: true, fontSize: 11,
    color: C.teal, charSpacing: 1.5, margin: 0,
  });
  const names = ["Karan Sasane", "Abhijeet Kapure", "Vishwesh Penkar"];
  names.forEach((n, i) => {
    s.addShape("ellipse", { x: 1.15 + i * 2.5, y: 5.78, w: 0.09, h: 0.09, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(n, {
      x: 1.32 + i * 2.5, y: 5.68, w: 2.2, h: 0.35, fontFace: FONT_HEAD, bold: true,
      fontSize: 14, color: C.white, margin: 0,
    });
  });
  s.addText("Database Management  ·  Academic Presentation  ·  2026", {
    x: 1.15, y: 6.2, w: 7, h: 0.35, fontFace: FONT_BODY, fontSize: 11,
    color: "9AA3D6", margin: 0,
  });
}

// ============================================================= SLIDE 2 — AGENDA
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Agenda", "What we'll walk through today");
  footerBrand(s);

  const items = [
    ["01", "Project Overview", "Why an ERP needs a disciplined relational schema, and what we set out to build.", MOD.org],
    ["02", "Database Design", "29 tables across 7 modules, with self-referencing hierarchies and full constraints.", MOD.prod],
    ["03", "Entity-Relationship Diagram", "A simplified view of how the core tables connect to each other.", MOD.sales],
    ["04", "20 Business Questions", "What's fully answered, what's partial, and what's still on the roadmap.", MOD.fin],
    ["05", "15 SQL Concept Queries", "A guided tour of the SQL toolbox — joins, subqueries, transactions, triggers.", MOD.hr],
    ["06", "Roadmap & Next Steps", "An honest close: what's built, what's designed, and what ships next.", MOD.mfg],
  ];
  const colW = 5.85, gapX = 0.3, startX = 0.7, startY = 1.85, rowH = 1.62;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX);
    const y = startY + row * rowH;
    s.addShape("roundRect", { x, y, w: colW, h: rowH - 0.22, rectRadius: 0.09, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.22, y: y + 0.22, w: 0.62, h: 0.62, rectRadius: 0.1, fill: { color: it[3] }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.22, y: y + 0.22, w: 0.62, h: 0.62, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 18, color: C.white, margin: 0 });
    s.addText(it[1], { x: x + 1.05, y: y + 0.18, w: colW - 1.25, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 15, color: C.navy, margin: 0 });
    s.addText(it[2], { x: x + 1.05, y: y + 0.53, w: colW - 1.25, h: 0.75, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0 });
  });
}

// ============================================================= SLIDE 3 — SCOPE / HONEST DISCLOSURE
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Scope of This Presentation", "Two separate deliverables live in this project — here's how they relate");
  footerBrand(s);

  s.addShape("roundRect", { x: 0.7, y: 1.85, w: 11.9, h: 1.5, rectRadius: 0.09, fill: { color: C.iceSoft }, line: { type: "none" } });
  s.addText([
    { text: "This deck demonstrates ", options: { color: C.ink } },
    { text: "15 core SQL concepts", options: { color: C.navy, bold: true } },
    { text: " (filtering, joins, subqueries, transactions, triggers, window functions) built and tested against our schema. ", options: { color: C.ink } },
    { text: "Separately, our mentor assigned 20 specific business questions.", options: { color: C.ink, bold: true } },
  ], { x: 1.0, y: 2.05, w: 11.3, h: 1.1, fontFace: FONT_BODY, fontSize: 15, lineSpacing: 22, margin: 0 });

  const cards = [
    { n: "3 of 20", label: "Fully answered", desc: "Questions 1–3: schema build-out, realistic seed data, and the complete sales-order report.", color: C.green },
    { n: "4 of 20", label: "Partially covered", desc: "Questions 4, 5, 18, 19 have working foundations that need one more targeted pass.", color: C.amber },
    { n: "13 of 20", label: "Designed, not yet implemented", desc: "The remaining questions are scoped with a clear build approach — walked through later in this deck.", color: C.red },
  ];
  const cw = 3.83, gap = 0.2, sx = 0.7, sy = 3.65;
  cards.forEach((c, i) => {
    const x = sx + i * (cw + gap);
    s.addShape("roundRect", { x, y: sy, w: cw, h: 2.9, rectRadius: 0.1, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x, y: sy, w: cw, h: 0.1, rectRadius: 0, fill: { color: c.color }, line: { type: "none" } });
    s.addText(c.n, { x: x + 0.3, y: sy + 0.35, w: cw - 0.6, h: 0.65, fontFace: FONT_HEAD, bold: true, fontSize: 32, color: c.color, margin: 0 });
    s.addText(c.label, { x: x + 0.3, y: sy + 1.05, w: cw - 0.6, h: 0.4, fontFace: FONT_HEAD, bold: true, fontSize: 15, color: C.navy, margin: 0 });
    s.addText(c.desc, { x: x + 0.3, y: sy + 1.5, w: cw - 0.6, h: 1.3, fontFace: FONT_BODY, fontSize: 11.5, color: C.gray, lineSpacing: 15, margin: 0 });
  });

  s.addText("We'd rather show you exactly where things stand than present unfinished work as done.", {
    x: 0.7, y: 6.75, w: 11.9, h: 0.35, fontFace: FONT_BODY, italic: true, fontSize: 11.5, color: C.gray, margin: 0,
  });
}

// ============================================================= SLIDE 4 — DATABASE OVERVIEW
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Database Overview", "29 tables organized into 7 functional modules");
  footerBrand(s);

  const mods = [
    ["Organization", "6 tables", "companies · employees · departments · users · roles", MOD.org],
    ["Products & Inventory", "5 tables", "products · categories · inventory · warehouses · stock movements", MOD.prod],
    ["Supply Chain", "3 tables", "suppliers · purchase orders · purchase order items", MOD.supply],
    ["Sales & CRM", "4 tables", "customers · addresses · sales orders · order items", MOD.sales],
    ["Financials", "5 tables", "invoices · invoice items · payments · GL accounts · GL entries", MOD.fin],
    ["Human Resources", "3 tables", "attendance · leave requests · payroll", MOD.hr],
    ["Manufacturing", "3 tables", "bill of materials · BOM components · production orders", MOD.mfg],
  ];
  const cw = 3.83, ch = 1.5, gapX = 0.2, gapY = 0.2, sx = 0.7, sy = 1.85;
  mods.forEach((m, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = sx + col * (cw + gapX);
    const y = sy + row * (ch + gapY);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("ellipse", { x: x + 0.25, y: y + 0.25, w: 0.22, h: 0.22, fill: { color: m[3] }, line: { type: "none" } });
    s.addText(m[0], { x: x + 0.58, y: y + 0.16, w: cw - 1.5, h: 0.4, fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.navy, margin: 0 });
    s.addText(m[1], { x: x - 0.05, y: y + 0.14, w: cw - 0.25, h: 0.4, align: "right", fontFace: FONT_BODY, bold: true, fontSize: 11, color: m[3], margin: 0 });
    s.addText(m[2], { x: x + 0.25, y: y + 0.65, w: cw - 0.5, h: 0.75, fontFace: FONT_BODY, fontSize: 10.5, color: C.gray, lineSpacing: 13, margin: 0 });
  });
  // 7th card + highlight box in last slot
  const hx = sx + 0 * (cw + gapX), hy = sy + 2 * (ch + gapY);
  s.addShape("roundRect", { x: hx + (cw + gapX), y: hy, w: cw, h: ch, rectRadius: 0.09, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("2 self-referencing tables", { x: hx + (cw + gapX) + 0.25, y: hy + 0.18, w: cw - 0.5, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.white, margin: 0 });
  s.addText("Employees reference their own manager; categories reference their own parent category — modeling org and product hierarchies of any depth.", {
    x: hx + (cw + gapX) + 0.25, y: hy + 0.55, w: cw - 0.5, h: 0.9, fontFace: FONT_BODY, fontSize: 10.5, color: C.ice, lineSpacing: 13, margin: 0,
  });
}

// ============================================================= SLIDE 5 — ER DIAGRAM
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Entity-Relationship Diagram", "A simplified view of the core schema — 9 of 29 tables, with real foreign-key relationships");
  footerBrand(s);

  const boxW = 2.75, boxH = 1.05;
  const nodes = {
    companies:   { x: 0.75, y: 1.85, label: "companies", fields: "PK company_id", color: MOD.org },
    employees:   { x: 4.05, y: 1.85, label: "employees", fields: "PK employee_id · FK manager_id (self)", color: MOD.org },
    warehouses:  { x: 9.85, y: 1.85, label: "warehouses", fields: "PK warehouse_id · FK company_id", color: MOD.prod },
    customers:   { x: 0.75, y: 3.35, label: "customers", fields: "PK customer_id · credit_limit", color: MOD.sales },
    products:    { x: 4.05, y: 3.35, label: "products", fields: "PK product_id · FK category_id", color: MOD.prod },
    inventory:   { x: 9.85, y: 3.35, label: "inventory", fields: "PK inventory_id · FK product/warehouse", color: MOD.prod },
    sales_orders:{ x: 0.75, y: 4.85, label: "sales_orders", fields: "PK sales_order_id · FK customer/employee", color: MOD.sales },
    invoices:    { x: 4.05, y: 4.85, label: "invoices", fields: "PK invoice_id · FK sales_order_id", color: MOD.fin },
    payments:    { x: 6.75, y: 4.85, label: "payments", fields: "PK payment_id · FK invoice_id", color: MOD.fin },
  };
  const cx = (n) => n.x + boxW / 2;
  const cy = (n) => n.y + boxH / 2;

  const edges = [
    ["companies", "employees"],
    ["employees", "sales_orders"],
    ["customers", "sales_orders"],
    ["products", "sales_orders"],
    ["products", "inventory"],
    ["warehouses", "inventory"],
    ["companies", "warehouses"],
    ["sales_orders", "invoices"],
    ["invoices", "payments"],
  ];
  edges.forEach(([a, b]) => {
    const A = nodes[a], B = nodes[b];
    const x1 = cx(A), y1 = cy(A), x2 = cx(B), y2 = cy(B);
    s.addShape("line", {
      x: Math.min(x1, x2), y: Math.min(y1, y2),
      w: Math.abs(x2 - x1) || 0.01, h: Math.abs(y2 - y1) || 0.01,
      flipH: x2 < x1, flipV: y2 < y1,
      line: { color: C.ice, width: 2 },
    });
  });

  Object.values(nodes).forEach((n) => {
    s.addShape("roundRect", { x: n.x, y: n.y, w: boxW, h: boxH, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 1 }, shadow: { type: "outer", color: "5B6178", opacity: 0.18, blur: 5, offset: 2, angle: 90 } });
    s.addShape("roundRect", { x: n.x, y: n.y, w: 0.09, h: boxH, rectRadius: 0, fill: { color: n.color }, line: { type: "none" } });
    s.addText(n.label, { x: n.x + 0.22, y: n.y + 0.1, w: boxW - 0.35, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.navy, margin: 0 });
    s.addText(n.fields, { x: n.x + 0.22, y: n.y + 0.48, w: boxW - 0.35, h: 0.5, fontFace: FONT_BODY, fontSize: 9, color: C.gray, lineSpacing: 11, margin: 0 });
  });

  // legend
  const legend = [["Organization", MOD.org], ["Products & Inventory", MOD.prod], ["Sales & CRM", MOD.sales], ["Financials", MOD.fin]];
  legend.forEach((l, i) => {
    const lx = 9.7 + (i % 2) * 1.55, ly = 4.9 + Math.floor(i / 2) * 0.42;
    s.addShape("ellipse", { x: lx, y: ly, w: 0.14, h: 0.14, fill: { color: l[1] }, line: { type: "none" } });
    s.addText(l[0], { x: lx + 0.22, y: ly - 0.06, w: 1.5, h: 0.28, fontFace: FONT_BODY, fontSize: 9, color: C.gray, margin: 0 });
  });
  s.addText("Full schema: 29 tables · 7 modules · complete PK / FK / UQ / CHECK constraints (see erp_schema.sql)", {
    x: 0.75, y: 6.35, w: 9.5, h: 0.35, fontFace: FONT_BODY, italic: true, fontSize: 10.5, color: C.gray, margin: 0,
  });
}

// ============================================================= SLIDE 6 — DATABASE STATISTICS
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Database Statistics", "Real numbers from our seeded dataset — not placeholder data");
  footerBrand(s);

  s.addChart("bar", [{
    name: "Tables",
    labels: ["Organization", "Products &\nInventory", "Financials", "Sales &\nCRM", "Supply\nChain", "HR", "Manufacturing"],
    values: [6, 5, 5, 4, 3, 3, 3],
  }], {
    x: 0.6, y: 1.85, w: 7.4, h: 4.7,
    showTitle: true, title: "Tables per Module", titleFontSize: 13, titleColor: C.navy, titleFontFace: FONT_HEAD, titleBold: true,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: C.navy,
    chartColors: [MOD.org, MOD.prod, MOD.fin, MOD.sales, MOD.supply, MOD.hr, MOD.mfg],
    barGapWidthPct: 35,
    catAxisLabelFontSize: 9.5, catAxisLabelColor: C.gray,
    valAxisLabelFontSize: 9, valAxisLabelColor: C.gray, valAxisMinVal: 0, valAxisMaxVal: 7,
    valGridLine: { color: C.line, size: 0.75 },
    catGridLine: { style: "none" },
    showLegend: false,
    dataBorder: { pt: 0, color: C.white },
  });

  const stats = [
    ["2", "Companies seeded"],
    ["10", "Employees seeded"],
    ["10", "Products seeded"],
    ["6", "Customers seeded"],
  ];
  const bx = 8.3, bw = 4.35;
  stats.forEach((st, i) => {
    const y = 1.85 + i * 1.0;
    s.addShape("roundRect", { x: bx, y, w: bw, h: 0.82, rectRadius: 0.08, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addText(st[0], { x: bx + 0.25, y: y + 0.08, w: 1.0, h: 0.66, fontFace: FONT_HEAD, bold: true, fontSize: 26, color: C.teal, valign: "middle", margin: 0 });
    s.addText(st[1], { x: bx + 1.35, y: y, w: bw - 1.55, h: 0.82, fontFace: FONT_BODY, fontSize: 12.5, color: C.navy, valign: "middle", margin: 0 });
  });
  s.addShape("roundRect", { x: bx, y: 5.85, w: bw, h: 0.65, rectRadius: 0.08, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("209 rows across all 29 tables — full transaction history included", {
    x: bx + 0.25, y: 5.85, w: bw - 0.5, h: 0.65, fontFace: FONT_BODY, bold: true, fontSize: 11, color: C.white, valign: "middle", lineSpacing: 13, margin: 0,
  });
}

// ============================================================= SLIDE 7 — LEDGER DESIGN HIGHLIGHT
{
  const s = pptx.addSlide();
  bg(s, C.navy);
  kicker(s, "Design Highlight", C.teal, 0.75, 0.7);
  s.addText("Why Two Ledger Tables Matter", {
    x: 0.7, y: 1.1, w: 8, h: 0.7, fontFace: FONT_HEAD, bold: true, fontSize: 28, color: C.white, margin: 0,
  });
  s.addText("Every inventory and financial event in the ERP funnels through two central ledger tables instead of being scattered across dozens of modules — so a full history query is always a single-table lookup.", {
    x: 0.7, y: 1.85, w: 6.4, h: 1.4, fontFace: FONT_BODY, fontSize: 14, color: C.ice, lineSpacing: 21, margin: 0,
  });

  const feeders = ["sales_orders", "purchase_orders", "production_orders", "invoices", "payments", "payroll"];
  feeders.forEach((f, i) => {
    const y = 3.55 + i * 0.5;
    s.addShape("roundRect", { x: 0.7, y, w: 2.4, h: 0.4, rectRadius: 0.06, fill: { color: C.navyDeep }, line: { color: "2B3576", width: 1 } });
    s.addText(f, { x: 0.7, y, w: 2.4, h: 0.4, align: "center", valign: "middle", fontFace: FONT_BODY, fontSize: 10.5, color: C.ice, margin: 0 });
    s.addShape("line", { x: 3.1, y: y + 0.2, w: 0.55, h: 0, line: { color: C.teal, width: 1.25, dashType: "dash" } });
  });

  // central ledger boxes
  s.addShape("roundRect", { x: 3.75, y: 4.4, w: 2.5, h: 1.1, rectRadius: 0.1, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("stock_movements", { x: 3.75, y: 4.4, w: 2.5, h: 0.55, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.navy, margin: 0 });
  s.addText("every unit in / out", { x: 3.75, y: 4.9, w: 2.5, h: 0.4, align: "center", fontFace: FONT_BODY, fontSize: 9.5, color: C.navyDeep, margin: 0 });

  s.addShape("roundRect", { x: 3.75, y: 5.7, w: 2.5, h: 1.1, rectRadius: 0.1, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("gl_entries", { x: 3.75, y: 5.7, w: 2.5, h: 0.55, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.navy, margin: 0 });
  s.addText("every debit / credit", { x: 3.75, y: 6.2, w: 2.5, h: 0.4, align: "center", fontFace: FONT_BODY, fontSize: 9.5, color: C.navyDeep, margin: 0 });

  // right side panel
  s.addShape("roundRect", { x: 7.4, y: 3.5, w: 5.2, h: 3.35, rectRadius: 0.1, fill: { color: C.navyDeep }, line: { color: "2B3576", width: 1 } });
  s.addText("What this buys us", { x: 7.7, y: 3.7, w: 4.6, h: 0.4, fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.teal, margin: 0 });
  const benefits = [
    "One query answers \"show me everything that happened to this product / account\" — no hunting across order tables.",
    "New modules (e.g. manufacturing) plug into the same ledger instead of inventing their own history tables.",
    "Audit and reconciliation reports read from one place, so numbers can't drift out of sync between modules.",
  ];
  benefits.forEach((b, i) => {
    const y = 4.2 + i * 0.85;
    s.addShape("ellipse", { x: 7.7, y: y + 0.05, w: 0.1, h: 0.1, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(b, { x: 7.95, y, w: 4.35, h: 0.85, fontFace: FONT_BODY, fontSize: 11, color: C.ice, lineSpacing: 14, margin: 0 });
  });
  pageNum(s, 7, true);
}

// ============================================================= SLIDE 8 — 20 QUESTIONS STATUS OVERVIEW
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "The 20 Assigned Business Questions", "Where the project stands, question by question");
  footerBrand(s);

  s.addChart("doughnut", [{
    name: "Status",
    labels: ["Fully Built", "Partially Built", "Designed, Not Built"],
    values: [3, 4, 13],
  }], {
    x: 0.5, y: 1.7, w: 5.6, h: 4.9,
    chartColors: [C.green, C.amber, C.red],
    showLegend: false,
    showValue: true, dataLabelFontSize: 13, dataLabelColor: C.white, dataLabelFontFace: FONT_HEAD, dataLabelBold: true,
    dataLabelFormatCode: "0",
    holeSize: 60,
  });
  s.addText("20", { x: 0.5, y: 3.65, w: 5.6, h: 0.5, align: "center", fontFace: FONT_HEAD, bold: true, fontSize: 30, color: C.navy, margin: 0 });
  s.addText("QUESTIONS", { x: 0.5, y: 4.2, w: 5.6, h: 0.3, align: "center", fontFace: FONT_BODY, fontSize: 10, color: C.gray, charSpacing: 2, margin: 0 });

  const rows = [
    ["Fully Built", "Q1, Q2, Q3", "Schema, seed data, and the sales order report — done and tested.", C.green],
    ["Partially Built", "Q4, Q5, Q18, Q19", "Working foundation exists; each needs one focused finishing pass.", C.amber],
    ["Designed, Not Built", "Q6–17, Q20 (13 total)", "Approach is scoped for every one — walked through in the roadmap slides.", C.red],
  ];
  rows.forEach((r, i) => {
    const y = 1.85 + i * 1.55;
    s.addShape("roundRect", { x: 6.55, y, w: 6.1, h: 1.3, rectRadius: 0.09, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: 6.55, y, w: 0.09, h: 1.3, rectRadius: 0, fill: { color: r[3] }, line: { type: "none" } });
    s.addText(r[0], { x: 6.85, y: y + 0.14, w: 3.2, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.navy, margin: 0 });
    s.addText(r[1], { x: 6.85, y: y + 0.14, w: 5.6, h: 0.35, align: "right", fontFace: FONT_BODY, bold: true, fontSize: 11.5, color: r[3], margin: 0 });
    s.addText(r[2], { x: 6.85, y: y + 0.55, w: 5.5, h: 0.65, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0 });
  });
}

// ============================================================= SLIDE 9 — FULLY BUILT
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Fully Built — Questions 1 to 3", "The foundation: schema, data, and the flagship report");
  footerBrand(s);
  statusChip(s, 11.0, 0.6, "FULLY BUILT", C.green);

  const items = [
    ["Q1", "All 29 Tables, Fully Constrained", "Every table built with primary keys, foreign keys, and validation rules — including two self-referencing relationships: employees to their own manager, and categories to their own parent category."],
    ["Q2", "Realistic Seed Data", "Two companies, ten employees, ten products, six customers, and a full transaction history — 209 rows across 29 tables — so every report returns numbers that make real business sense."],
    ["Q3", "Complete Sales Order Report", "One query joins six tables to bring together the customer, salesperson, every product line, the order total, and both invoice and payment status in a single readable report."],
  ];
  const cw = 3.83, sx = 0.7, sy = 1.95, ch = 4.6;
  items.forEach((it, i) => {
    const x = sx + i * (cw + 0.2);
    s.addShape("roundRect", { x, y: sy, w: cw, h: ch, rectRadius: 0.1, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.3, y: sy + 0.3, w: 0.85, h: 0.5, rectRadius: 0.07, fill: { color: C.green }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.3, y: sy + 0.3, w: 0.85, h: 0.5, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 16, color: C.white, margin: 0 });
    s.addText(it[1], { x: x + 0.3, y: sy + 1.0, w: cw - 0.6, h: 0.9, fontFace: FONT_HEAD, bold: true, fontSize: 15, color: C.navy, lineSpacing: 18, margin: 0 });
    s.addText(it[2], { x: x + 0.3, y: sy + 1.95, w: cw - 0.6, h: 2.4, fontFace: FONT_BODY, fontSize: 11.5, color: C.gray, lineSpacing: 16, margin: 0 });
  });
}

// ============================================================= SLIDE 10 — PARTIALLY BUILT
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Partially Built — Questions 4, 5, 18, 19", "Working foundations that need one more finishing pass");
  footerBrand(s);
  statusChip(s, 10.65, 0.6, "IN PROGRESS", C.amber);

  const items = [
    ["Q4", "Inventory Reorder Alert", "Stock aggregation exists (Query 12). Still needed: compare current stock to each product's reorder point and flag shortfalls with a CASE label."],
    ["Q5", "Top 10 Customers by Sales", "Query 15 ranks the top 3 today. Needs extending to top 10, plus credit-limit utilization framing tied specifically to this question."],
    ["Q18", "Automated Inventory Triggers", "An audit-log trigger exists (Query 14). Still needed: a stock-sync trigger on movements, and a guard that blocks any update pushing stock negative."],
    ["Q19", "Full Order Workflow Transaction", "A basic rollback demo exists (Query 11). Needed: the full 5-step chained transaction — order, inventory, invoice, payment, accounting."],
  ];
  const cw = 5.85, ch = 2.1, sx = 0.7, sy = 1.9;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = sx + col * (cw + 0.2), y = sy + row * (ch + 0.2);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.28, y: y + 0.25, w: 0.7, h: 0.44, rectRadius: 0.07, fill: { color: C.amber }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.28, y: y + 0.25, w: 0.7, h: 0.44, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.white, margin: 0 });
    s.addText(it[1], { x: x + 1.1, y: y + 0.2, w: cw - 1.35, h: 0.55, fontFace: FONT_HEAD, bold: true, fontSize: 13.5, color: C.navy, valign: "middle", margin: 0 });
    s.addText(it[2], { x: x + 0.28, y: y + 0.85, w: cw - 0.56, h: 1.15, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 15, margin: 0 });
  });
}

// ============================================================= SLIDE 11 — ROADMAP: REPORTING
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Roadmap — Reporting & Operational Questions", "Scoped and ready to build: 7 of the remaining 13 questions");
  footerBrand(s);
  statusChip(s, 11.15, 0.6, "PLANNED", C.red);

  const rows = [
    ["Q6", "Top 10 products by date range", "Rank products by quantity sold and revenue within a chosen window; add profit margin per product."],
    ["Q7", "Outstanding invoices vs. credit limit", "Total unpaid invoices per customer and flag anyone who has exceeded their credit limit."],
    ["Q8", "Supplier delivery issues", "Compare actual vs. promised delivery time per supplier; flag chronic lateness or low ratings."],
    ["Q9", "Overdue purchase orders", "Find POs past their expected delivery date; compute days overdue with a follow-up / urgent / critical tier."],
    ["Q10", "Employee attendance issues", "Flag employees with excessive absences or average hours below the required threshold."],
    ["Q11", "Latest payment per customer", "For every customer, surface their single most recent payment — date, amount, method."],
    ["Q13", "Product profitability ranking", "Revenue minus cost per product, ranked most to least profitable with a window function."],
  ];
  const sx = 0.7, sy = 1.9, rh = 0.66;
  rows.forEach((r, i) => {
    const y = sy + i * rh;
    if (i % 2 === 0) s.addShape("rect", { x: sx, y, w: 11.9, h: rh, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addText(r[0], { x: sx + 0.2, y, w: 0.7, h: rh, valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.red, margin: 0 });
    s.addText(r[1], { x: sx + 1.0, y, w: 3.7, h: rh, valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 12, color: C.navy, margin: 0 });
    s.addText(r[2], { x: sx + 4.85, y, w: 6.9, h: rh, valign: "middle", fontFace: FONT_BODY, fontSize: 10.5, color: C.gray, lineSpacing: 12, margin: 0 });
  });
}

// ============================================================= SLIDE 12 — ROADMAP: ADVANCED ENGINEERING
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Roadmap — Advanced Database Engineering", "The remaining 6 questions: recursion, automation, and performance");
  footerBrand(s);
  statusChip(s, 11.15, 0.6, "PLANNED", C.red);

  const rows = [
    ["Q12", "Employee hierarchy (recursive CTE)", "WITH RECURSIVE, walking the management chain down from the top to any depth."],
    ["Q14", "ERP dashboard VIEW", "CREATE VIEW combining revenue, purchases, inventory value, and receivables by company and month."],
    ["Q15", "Indexing & EXPLAIN", "Indexes on the columns we filter/join most; EXPLAIN showing the shift from table scan to index lookup."],
    ["Q16", "Stored procedure — sales order", "One call to check stock, create the order, create the invoice, and reduce inventory."],
    ["Q17", "Stored procedure — production order", "Checks the Bill of Materials, deducts raw materials, adds finished goods — one transaction."],
    ["Q20", "Management report (CTEs + windows)", "Monthly sales, profit, and inventory value with running totals and MoM growth via RANK / LAG."],
  ];
  const cw = 5.85, ch = 1.42, sx = 0.7, sy = 1.9;
  rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = sx + col * (cw + 0.2), y = sy + row * (ch + 0.15);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.25, y: y + 0.2, w: 0.62, h: 0.4, rectRadius: 0.06, fill: { color: C.navy }, line: { type: "none" } });
    s.addText(r[0], { x: x + 0.25, y: y + 0.2, w: 0.62, h: 0.4, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 12.5, color: C.white, margin: 0 });
    s.addText(r[1], { x: x + 1.02, y: y + 0.16, w: cw - 1.25, h: 0.42, fontFace: FONT_HEAD, bold: true, fontSize: 12.5, color: C.navy, valign: "middle", lineSpacing: 14, margin: 0 });
    s.addText(r[2], { x: x + 0.25, y: y + 0.68, w: cw - 0.5, h: 0.66, fontFace: FONT_BODY, fontSize: 10, color: C.gray, lineSpacing: 12.5, margin: 0 });
  });
}

// ============================================================= SLIDE 13 — SECTION DIVIDER
{
  const s = pptx.addSlide();
  sectionHeader(s, "02", "15 SQL Concept\nQueries, Demonstrated");
  s.addText("A separate, hands-on tour of the SQL toolbox — from basic filtering to joins, subqueries, transactions, triggers, and window functions. These queries are the building blocks the 20 business questions are built from; they are not the 20 answers themselves.", {
    x: 0.9, y: 5.0, w: 9.5, h: 1.5, fontFace: FONT_BODY, fontSize: 14, color: C.ice, lineSpacing: 20, margin: 0,
  });
  dbIcon(s, 11.2, 3.0, 1.1, C.teal, C.gold);
  pageNum(s, 13, true);
}

// ============================================================= SLIDE 14 — SQL TOOLBOX GRID
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "The SQL Toolbox — 15 Queries at a Glance", "Every core SQL concept, demonstrated against our live schema");
  footerBrand(s);

  const items = [
    ["1", "WHERE filtering", "Products priced above ₹5,000"],
    ["2", "INNER JOIN", "Employees with department names"],
    ["3", "LEFT JOIN + WHERE", "Completed orders, no customer dropped"],
    ["4", "GROUP BY + HAVING", "Salespeople over ₹1,00,000 in sales"],
    ["5", "Non-correlated subquery", "Products below average price"],
    ["6", "Correlated subquery", "Employees above their dept average"],
    ["7", "4-table JOIN", "Full sales order detail, 5 tables"],
    ["8", "UNION ALL", "Merged employee + customer directory"],
    ["9", "DDL — CREATE TABLE", "New audit_log table structure"],
    ["10", "DML — INSERT", "One new employee record"],
    ["11", "TCL — ROLLBACK", "Safe test of a payroll raise, undone"],
    ["12", "GROUP BY, 3 aggregates", "Warehouse stock summary"],
    ["13", "CASE WHEN", "Invoice status as readable labels"],
    ["14", "Trigger", "Auto-logs every employee UPDATE"],
    ["15", "Window function RANK()", "Top 3 customers by revenue"],
  ];
  const cw = 2.36, ch = 1.42, gapX = 0.13, gapY = 0.15, sx = 0.7, sy = 1.85;
  items.forEach((it, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = sx + col * (cw + gapX), y = sy + row * (ch + gapY);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.08, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("ellipse", { x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.4, fill: { color: C.navy }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.4, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.white, margin: 0 });
    s.addText(it[1], { x: x + 0.15, y: y + 0.62, w: cw - 0.3, h: 0.4, fontFace: FONT_HEAD, bold: true, fontSize: 10.5, color: C.navy, lineSpacing: 12, margin: 0 });
    s.addText(it[2], { x: x + 0.15, y: y + 1.0, w: cw - 0.3, h: 0.38, fontFace: FONT_BODY, fontSize: 8.7, color: C.gray, lineSpacing: 10, margin: 0 });
  });
}

// ============================================================= SLIDE 15 — SPOTLIGHT: JOINS & SUBQUERIES
function sqlCard(s, x, y, w, h, label, code) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: C.navyDeep }, line: { type: "none" } });
  s.addText(label, { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: 0.3, fontFace: FONT_BODY, bold: true, fontSize: 9.5, color: C.teal, charSpacing: 1, margin: 0 });
  s.addText(code, { x: x + 0.2, y: y + 0.4, w: w - 0.4, h: h - 0.55, fontFace: "Courier New", fontSize: 10, color: C.ice, lineSpacing: 13, margin: 0 });
}

{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Spotlight — Joins & Subqueries", "Stitching related data back together, and filtering against a computed benchmark");
  footerBrand(s);

  sqlCard(s, 0.7, 1.85, 5.85, 2.0,
    "QUERY 3 — LEFT JOIN + WHERE",
    "SELECT c.customer_name, so.*\nFROM customers c\nLEFT JOIN sales_orders so\n  ON c.customer_id = so.customer_id\nWHERE so.status = 'Completed';"
  );
  s.addText("LEFT JOIN keeps every customer even with zero orders — nobody silently disappears. INNER JOIN would drop them.", {
    x: 0.7, y: 3.95, w: 5.85, h: 0.75, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0,
  });

  sqlCard(s, 6.75, 1.85, 5.85, 2.0,
    "QUERY 6 — CORRELATED SUBQUERY",
    "SELECT e.* FROM employees e\nWHERE e.salary > (\n  SELECT AVG(salary)\n  FROM employees e2\n  WHERE e2.department_id =\n        e.department_id\n);"
  );
  s.addText("The inner query re-runs for every employee, comparing each only to their own department average — not the whole company.", {
    x: 6.75, y: 3.95, w: 5.85, h: 0.75, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0,
  });

  sqlCard(s, 0.7, 4.85, 11.9, 1.55,
    "QUERY 7 — FOUR-TABLE JOIN",
    "SELECT so.order_code, c.customer_name, e.first_name, p.product_name,\n       soi.quantity, soi.unit_price, soi.total_price\nFROM sales_orders so\nJOIN customers c ON so.customer_id = c.customer_id\nJOIN employees e ON so.employee_id = e.employee_id\nJOIN sales_order_items soi ON so.sales_order_id = soi.sales_order_id\nJOIN products p ON soi.product_id = p.product_id;   -- rebuilds one order's full story"
  );
}

// ============================================================= SLIDE 16 — SPOTLIGHT: TRANSACTIONS & TRIGGERS
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Spotlight — Transactions & Triggers", "Safety nets and automation that run without a developer remembering to act");
  footerBrand(s);

  sqlCard(s, 0.7, 1.85, 5.85, 3.0,
    "QUERY 11 — TRANSACTION + ROLLBACK",
    "START TRANSACTION;\n\nUPDATE employees\nSET salary = salary * 1.10\nWHERE department_id = (\n  SELECT department_id FROM departments\n  WHERE department_name = 'IT'\n);\n\n-- verify the change...\nROLLBACK;   -- undo completely"
  );
  s.addText("Proves the safety net works before ever risking it against real payroll data — the change is thrown away as if it never happened.", {
    x: 0.7, y: 5.0, w: 5.85, h: 0.85, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0,
  });

  sqlCard(s, 6.75, 1.85, 5.85, 3.0,
    "QUERY 14 — TRIGGER",
    "CREATE TRIGGER trg_employee_audit\nAFTER UPDATE ON employees\nFOR EACH ROW\nINSERT INTO audit_log\n  (table_name, record_id,\n   changed_by, changed_at)\nVALUES\n  ('employees', OLD.employee_id,\n   USER(), NOW());"
  );
  s.addText("Fires automatically the moment MySQL sees an UPDATE — nobody has to remember to call it. This is how audit trails work without manual logging.", {
    x: 6.75, y: 5.0, w: 5.85, h: 0.85, fontFace: FONT_BODY, fontSize: 11, color: C.gray, lineSpacing: 14, margin: 0,
  });
}

// ============================================================= SLIDE 17 — SPOTLIGHT: AGGREGATION & WINDOW FUNCTIONS
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Spotlight — Aggregation & Window Functions", "Turning raw rows into leaderboards and readable, decision-ready labels");
  footerBrand(s);

  sqlCard(s, 0.7, 1.85, 5.85, 2.35,
    "QUERY 13 — CASE WHEN",
    "SELECT invoice_id,\n  CASE\n    WHEN outstanding_amount = 0\n      THEN 'Fully Settled'\n    WHEN due_date >= CURDATE()\n      THEN 'Pending Payment'\n    ELSE 'ACTION REQUIRED'\n  END AS status_label\nFROM invoices;"
  );

  sqlCard(s, 6.75, 1.85, 5.85, 2.35,
    "QUERY 15 — WINDOW FUNCTION",
    "SELECT customer_name,\n  SUM(total_amount) AS revenue,\n  RANK() OVER (\n    ORDER BY SUM(total_amount) DESC\n  ) AS revenue_rank\nFROM sales_orders so\nJOIN customers c USING(customer_id)\nGROUP BY customer_name\nLIMIT 3;"
  );

  s.addShape("roundRect", { x: 0.7, y: 4.55, w: 11.9, h: 1.85, rectRadius: 0.09, fill: { color: C.iceSoft }, line: { type: "none" } });
  s.addText("Why this pairing matters", { x: 1.0, y: 4.75, w: 6, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.navy, margin: 0 });
  s.addText("CASE WHEN turns database codes into labels a non-technical manager can read at a glance. RANK() OVER numbers every row without collapsing it the way plain GROUP BY would — you keep every customer's row and still get a clean top-N leaderboard. Together, they're the standard tools behind almost every dashboard tile in a real ERP.", {
    x: 1.0, y: 5.1, w: 11.3, h: 1.2, fontFace: FONT_BODY, fontSize: 12, color: C.ink, lineSpacing: 17, margin: 0,
  });
}

// ============================================================= SLIDE 18 — WHAT WE'D BUILD NEXT
{
  const s = pptx.addSlide();
  bg(s, C.navy);
  kicker(s, "Closing the Gap", C.teal, 0.75, 0.65);
  s.addText("What We'd Build Next", { x: 0.7, y: 1.05, w: 9, h: 0.65, fontFace: FONT_HEAD, bold: true, fontSize: 30, color: C.white, margin: 0 });
  s.addText("A short, honest roadmap for the 13 questions still marked \"designed, not built.\"", {
    x: 0.7, y: 1.65, w: 9.5, h: 0.4, fontFace: FONT_BODY, fontSize: 13.5, color: C.ice, margin: 0,
  });

  const phases = [
    ["Phase 1 — Reporting Queries", "Q6, Q7, Q9, Q10, Q11, Q13", "Straightforward JOIN + aggregation work, extending patterns already proven in Queries 1–15.", C.teal],
    ["Phase 2 — Automation", "Q16, Q17, Q18 (finish), Q19 (finish)", "Stored procedures for order and production workflows, plus the negative-stock trigger guard.", C.gold],
    ["Phase 3 — Advanced SQL", "Q8, Q12, Q14, Q15, Q20", "Recursive CTEs, a management-dashboard VIEW, indexing with EXPLAIN, and stacked window functions.", C.red],
  ];
  phases.forEach((p, i) => {
    const y = 2.3 + i * 1.5;
    s.addShape("roundRect", { x: 0.7, y, w: 11.9, h: 1.25, rectRadius: 0.09, fill: { color: C.navyDeep }, line: { color: "2B3576", width: 1 } });
    s.addShape("roundRect", { x: 0.7, y, w: 0.09, h: 1.25, rectRadius: 0, fill: { color: p[3] }, line: { type: "none" } });
    s.addText(p[0], { x: 1.0, y: y + 0.15, w: 4.5, h: 0.35, fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.white, margin: 0 });
    s.addText(p[1], { x: 1.0, y: y + 0.5, w: 4.5, h: 0.35, fontFace: FONT_BODY, bold: true, fontSize: 10.5, color: p[3], margin: 0 });
    s.addText(p[2], { x: 5.7, y: y + 0.18, w: 6.6, h: 0.9, valign: "middle", fontFace: FONT_BODY, fontSize: 11.5, color: C.ice, lineSpacing: 15, margin: 0 });
  });
  pageNum(s, 18, true);
}

// ============================================================= SLIDE 19 — TECH STACK / HOSTING
{
  const s = pptx.addSlide();
  bg(s, C.white);
  title(s, "Tech Stack & Hosting", "The tools behind the design, build, and delivery of this project");
  footerBrand(s);

  const stack = [
    ["Database Engine", "MySQL 8.4.8", "Window functions, recursive CTEs, and full trigger support.", MOD.org],
    ["Hosting", "Aiven Managed MySQL", "Cloud-hosted instance — connection credentials kept out of shared materials.", MOD.fin],
    ["Schema Design", "draw.io", "Entity-relationship modeling for all 29 tables across 7 modules.", MOD.sales],
    ["Query Client", "MySQL Workbench", "Writing, testing, and validating every query against live seed data.", MOD.prod],
  ];
  const cw = 5.85, ch = 2.05, sx = 0.7, sy = 1.9;
  stack.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = sx + col * (cw + 0.2), y = sy + row * (ch + 0.2);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: C.lightGray }, line: { type: "none" } });
    s.addShape("roundRect", { x: x + 0.3, y: y + 0.3, w: 0.55, h: 0.55, rectRadius: 0.1, fill: { color: it[3] }, line: { type: "none" } });
    s.addText(it[0][0], { x: x + 0.3, y: y + 0.3, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: FONT_HEAD, bold: true, fontSize: 18, color: C.white, margin: 0 });
    s.addText(it[0], { x: x + 1.05, y: y + 0.28, w: cw - 1.3, h: 0.32, fontFace: FONT_BODY, fontSize: 10.5, color: C.gray, margin: 0 });
    s.addText(it[1], { x: x + 1.05, y: y + 0.55, w: cw - 1.3, h: 0.4, fontFace: FONT_HEAD, bold: true, fontSize: 15, color: C.navy, margin: 0 });
    s.addText(it[2], { x: x + 0.3, y: y + 1.25, w: cw - 0.6, h: 0.65, fontFace: FONT_BODY, fontSize: 10.5, color: C.gray, lineSpacing: 14, margin: 0 });
  });

  s.addText("Note: connection host, port, username, and password are intentionally omitted from this presentation and every shared file.", {
    x: 0.7, y: 6.35, w: 11.9, h: 0.4, fontFace: FONT_BODY, italic: true, fontSize: 10.5, color: C.gray, margin: 0,
  });
}

// ============================================================= SLIDE 20 — THANK YOU
{
  const s = pptx.addSlide();
  bg(s, C.navy);
  s.addShape("rect", { x: 0, y: 0, w: 4.4, h: PGH, fill: { color: C.navyDeep }, line: { type: "none" } });
  dbIcon(s, 1.0, 1.0, 1.4, C.teal, C.gold);
  dbIcon(s, 2.4, 3.0, 0.9, C.ice, C.teal);
  dbIcon(s, 0.9, 4.6, 0.7, C.gold, C.teal);

  s.addText("Thank You", { x: 5.0, y: 2.3, w: 7.6, h: 1.0, fontFace: FONT_HEAD, bold: true, fontSize: 44, color: C.white, margin: 0 });
  s.addText("Questions on the schema, the queries, or the roadmap? Happy to walk through any of it in more depth.", {
    x: 5.05, y: 3.35, w: 7.3, h: 0.7, fontFace: FONT_BODY, fontSize: 14, color: C.ice, lineSpacing: 19, margin: 0,
  });

  s.addShape("roundRect", { x: 5.0, y: 4.3, w: 7.6, h: 1.9, rectRadius: 0.09, fill: { color: C.navyDeep }, line: { color: "2B3576", width: 1 } });
  s.addText("TEAM TEEN KABIL TALWARBAZZ", { x: 5.3, y: 4.5, w: 7, h: 0.35, fontFace: FONT_BODY, bold: true, fontSize: 12, color: C.teal, charSpacing: 1.5, margin: 0 });
  const names2 = ["Karan Sasane", "Abhijeet Kapure", "Vishwesh Penkar"];
  names2.forEach((n, i) => {
    const y = 4.95 + i * 0.42;
    s.addShape("ellipse", { x: 5.3, y: y + 0.08, w: 0.09, h: 0.09, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(n, { x: 5.5, y, w: 6, h: 0.35, fontFace: FONT_HEAD, fontSize: 14, color: C.white, margin: 0 });
  });
  pageNum(s, 20, true);
}

// ============================================================= WRITE
pptx.writeFile({ fileName: "/mnt/user-data/outputs/ERP_Database_Management_Presentation.pptx" }).then(() => {
  console.log("DONE");
});