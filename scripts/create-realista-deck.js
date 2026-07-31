import pptxgen from "pptxgenjs";
import path from "node:path";
import fs from "node:fs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Realista";
pptx.subject = "Realista x Papernest product strategy";
pptx.title = "Realista — The Operating System for Real Estate Agencies";
pptx.company = "Realista";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineSlideMaster({
  title: "MASTER",
  background: { color: "F8FAFC" },
  objects: [
    { rect: { x: 0, y: 7.28, w: 13.333, h: 0.22, fill: { color: "0F8FC5" }, line: { color: "0F8FC5" } } },
  ],
  slideNumber: { x: 12.72, y: 7.04, color: "94A3B8", fontFace: "Aptos", fontSize: 8 },
});

const W = 13.333;
const H = 7.5;
const C = {
  ink: "102030",
  muted: "5C6B7A",
  blue: "0F8FC5",
  blue2: "1F5FBF",
  paleBlue: "EAF6FB",
  pale: "F8FAFC",
  line: "DCE5EC",
  green: "19B67A",
  greenPale: "E8F8F1",
  orange: "F4A62A",
  orangePale: "FFF4DF",
  purple: "7C5CFC",
  purplePale: "F1EEFF",
  red: "E9566A",
  white: "FFFFFF",
  dark: "102A43",
};

const root = process.cwd();
const asset = (file) => path.join(root, "attached_assets", file);
const hero = path.join(root, "exports", "realista-hero.jpg");
const img = {
  property: asset("image_1770598944390.png"),
  propertyRent: asset("image_1770636375447.png"),
  documents: asset("image_1770636403617.png"),
  incidents: asset("image_1770636426912.png"),
  history: asset("image_1770636520018.png"),
  calendar: asset("image_1777757984743.png"),
  mortgage: asset("image_1777803554111.png"),
  publicSearch: asset("screenshot-1744418466126.png"),
  clientSearch: asset("image_1759658352887.png"),
  clientProfile: asset("image_1766179325531.png"),
  signup: asset("image_1762717461229.png"),
};

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: opts.fontFace || "Aptos",
    fontSize: opts.fontSize || 18,
    color: opts.color || C.ink,
    bold: opts.bold || false,
    breakLine: false,
    margin: opts.margin ?? 0,
    fit: "shrink",
    valign: opts.valign || "mid",
    align: opts.align || "left",
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
    bullet: opts.bullet,
    italic: opts.italic || false,
    charSpacing: opts.charSpacing || 0,
    transparency: opts.transparency,
  });
}

function addRichText(slide, runs, x, y, w, h, opts = {}) {
  slide.addText(runs, {
    x, y, w, h,
    fontFace: opts.fontFace || "Aptos",
    fontSize: opts.fontSize || 18,
    color: opts.color || C.ink,
    margin: opts.margin ?? 0,
    fit: "shrink",
    valign: opts.valign || "mid",
    breakLine: false,
    bold: opts.bold || false,
  });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 1.2, dash = "solid") {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width, dashType: dash, beginArrowType: "none", endArrowType: "none" },
  });
}

function arrow(slide, x1, y1, x2, y2, color = C.blue, width = 2.2) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width, endArrowType: "triangle" },
  });
}

function rounded(slide, x, y, w, h, fill = C.white, border = C.line, radius = 0.12, shadow = true) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: radius,
    fill: { color: fill },
    line: { color: border, width: 0.8 },
    shadow: shadow ? { type: "outer", color: "7C8EA3", opacity: 0.12, blur: 2, angle: 45, distance: 1 } : undefined,
  });
}

function pill(slide, text, x, y, w, color = C.blue, fill = C.paleBlue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.12, fill: { color: fill }, line: { color: fill } });
  addText(slide, text, x, y + 0.005, w, 0.28, { fontSize: 9, bold: true, color, align: "center" });
}

function title(slide, kicker, headline, sub = "") {
  addText(slide, kicker.toUpperCase(), 0.62, 0.38, 3.3, 0.24, { fontSize: 9, bold: true, color: C.blue, charSpacing: 1.6 });
  addText(slide, headline, 0.62, 0.66, 8.7, 0.65, { fontFace: "Aptos Display", fontSize: 28, bold: true, color: C.ink });
  if (sub) addText(slide, sub, 0.64, 1.38, 8.7, 0.38, { fontSize: 13, color: C.muted });
}

function addScreenshot(slide, file, x, y, w, h, opts = {}) {
  if (!fs.existsSync(file)) return;
  rounded(slide, x - 0.04, y - 0.04, w + 0.08, h + 0.08, C.white, opts.border || C.line, 0.12, true);
  slide.addImage({ path: file, x, y, w, h, sizingCrop: opts.crop !== false });
}

function addLogo(slide, x = 0.62, y = 0.25, light = false) {
  slide.addShape(pptx.ShapeType.actionButtonHome, { x, y: y + 0.02, w: 0.22, h: 0.22, fill: { color: light ? C.white : C.blue }, line: { color: light ? C.white : C.blue, width: 1 } });
  addText(slide, "Realista", x + 0.29, y, 1.2, 0.28, { fontSize: 13, bold: true, color: light ? C.white : C.blue });
}

function note(slide, text, x, y, w, color = C.muted) {
  addText(slide, text, x, y, w, 0.25, { fontSize: 9, color, italic: true });
}

function iconCircle(slide, symbol, x, y, fill, color = C.white) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.38, h: 0.38, fill: { color: fill }, line: { color: fill } });
  addText(slide, symbol, x, y + 0.005, 0.38, 0.34, { fontSize: 14, bold: true, color, align: "center" });
}

function card(slide, heading, body, x, y, w, h, accent = C.blue, symbol = "•") {
  rounded(slide, x, y, w, h, C.white, C.line, 0.12, true);
  iconCircle(slide, symbol, x + 0.22, y + 0.2, accent);
  addText(slide, heading, x + 0.72, y + 0.2, w - 0.92, 0.3, { fontSize: 14, bold: true });
  addText(slide, body, x + 0.22, y + 0.67, w - 0.44, h - 0.82, { fontSize: 11, color: C.muted, valign: "top" });
}

function addSlide() {
  return pptx.addSlide("MASTER");
}

// 1 — Cover
{
  const s = addSlide();
  s.background = { color: C.white };
  addLogo(s);
  pill(s, "PRODUCT STRATEGY · 2026", 10.65, 0.28, 2.0, C.blue, C.paleBlue);
  addText(s, "Realista", 0.72, 1.24, 5.2, 0.7, { fontFace: "Aptos Display", fontSize: 40, bold: true });
  addText(s, "The Operating System\nfor Real Estate Agencies", 0.72, 1.98, 6.2, 1.25, { fontFace: "Aptos Display", fontSize: 29, bold: true, color: C.dark, valign: "top" });
  addText(s, "From lead management to home services in one platform.", 0.75, 3.42, 5.5, 0.4, { fontSize: 15, color: C.muted });
  addText(s, "A platform thesis for Papernest", 0.75, 4.1, 3.2, 0.28, { fontSize: 11, bold: true, color: C.blue });
  addScreenshot(s, hero, 6.2, 1.04, 6.42, 4.45, { crop: false, border: C.paleBlue });
  addShapeLabel(s, "One workspace. One customer journey.", 6.45, 5.78, 5.95);
}

function addShapeLabel(s, text, x, y, w) {
  rounded(s, x, y, w, 0.5, C.dark, C.dark, 0.12, false);
  addText(s, text, x + 0.18, y + 0.03, w - 0.36, 0.4, { fontSize: 12, bold: true, color: C.white });
}

// 2 — Problem
{
  const s = addSlide();
  title(s, "01 · The gap", "Agencies run on a patchwork of tools.", "Every handoff creates friction—and every disconnected system loses context.");
  const tools = [
    ["CRM", "▦", C.blue], ["WhatsApp", "◌", C.green], ["Excel", "▤", C.orange],
    ["Calendar", "◷", C.purple], ["Email", "✉", C.red], ["Portals", "⌂", C.blue2],
  ];
  tools.forEach(([label, sym, color], i) => {
    const x = 0.75 + (i % 3) * 1.75;
    const y = 2.28 + Math.floor(i / 3) * 0.85;
    rounded(s, x, y, 1.45, 0.58, C.white, C.line, 0.12, true);
    addText(s, sym, x + 0.16, y + 0.06, 0.32, 0.36, { fontSize: 18, bold: true, color });
    addText(s, label, x + 0.55, y + 0.08, 0.76, 0.3, { fontSize: 11, bold: true });
  });
  arrow(s, 2.55, 4.18, 3.72, 4.18, C.blue);
  arrow(s, 5.16, 4.18, 6.34, 4.18, C.blue);
  arrow(s, 7.78, 4.18, 8.95, 4.18, C.blue);
  ["Lost productivity", "Poor collaboration", "Manual processes"].forEach((t, i) => {
    rounded(s, 3.1 + i * 2.62, 3.84, 2.05, 0.68, i === 2 ? C.orangePale : C.paleBlue, i === 2 ? C.orange : C.line, 0.12, false);
    addText(s, t, 3.2 + i * 2.62, 3.95, 1.85, 0.38, { fontSize: 11, bold: true, color: i === 2 ? C.orange : C.blue, align: "center" });
  });
  addShapeLabel(s, "Realista · one platform", 9.55, 3.78, 2.45);
  note(s, "The opportunity is not another tool. It is the connective tissue.", 0.76, 5.82, 6.6);
}

// 3 — What is Realista?
{
  const s = addSlide();
  title(s, "02 · The product", "Realista centralizes the complete workflow.", "A horizontal operating layer for the people, properties, and processes that make an agency run.");
  const pillars = [
    ["CRM", "Clients, pipeline, relationships", C.blue, "●"],
    ["Property Management", "Inventory, documents, incidents", C.green, "⌂"],
    ["Calendar", "Visits, team availability, actions", C.orange, "◷"],
    ["Messaging", "Conversation in context", C.purple, "✉"],
    ["Search Preferences", "Intent captured early", C.blue2, "⌕"],
    ["Intelligent Matching", "Client ↔ property fit", C.red, "↔"],
    ["Agency Administration", "The operating backbone", C.dark, "▦"],
  ];
  pillars.forEach(([h, b, color, sym], i) => {
    const x = 0.72 + (i % 4) * 3.08;
    const y = 2.25 + Math.floor(i / 4) * 1.45;
    card(s, h, b, x, y, 2.72, 1.08, color, sym);
  });
  addShapeLabel(s, "Horizontal by design", 9.62, 5.7, 2.3);
}

// 4 — Architecture
{
  const s = addSlide();
  title(s, "03 · The system", "The platform compounds as context moves with the customer.", "Each layer enriches the next—turning isolated records into an operating system.");
  const nodes = [
    ["Clients", "who", C.blue],
    ["Client Preferences", "why", C.green],
    ["Properties", "what", C.orange],
    ["Recommendations", "fit", C.purple],
    ["Relationship Management", "action", C.red],
    ["Agency Operations", "scale", C.dark],
  ];
  nodes.forEach(([h, sub, color], i) => {
    const y = 1.98 + i * 0.82;
    rounded(s, 4.0, y, 5.25, 0.58, i === 5 ? C.dark : C.white, i === 5 ? C.dark : C.line, 0.14, true);
    addText(s, h, 4.3, y + 0.04, 3.25, 0.3, { fontSize: 15, bold: true, color: i === 5 ? C.white : C.ink });
    pill(s, sub, 8.17, y + 0.14, 0.68, i === 5 ? C.white : color, i === 5 ? "24435E" : C.paleBlue);
    if (i < nodes.length - 1) arrow(s, 6.6, y + 0.6, 6.6, y + 0.79, color, 1.8);
  });
  addText(s, "The agency’s data model becomes the agency’s operating model.", 0.85, 2.35, 2.5, 1.6, { fontFace: "Aptos Display", fontSize: 22, bold: true, color: C.dark, valign: "top" });
  note(s, "One record. More context. More moments to create value.", 0.88, 4.42, 2.8);
}

// 5 — CRM
{
  const s = addSlide();
  title(s, "04 · CRM", "Manage every client from lead to closing.", "A single relationship layer for the agent’s daily work.");
  addScreenshot(s, img.clientSearch, 0.7, 2.0, 5.15, 3.35, { crop: false });
  addScreenshot(s, img.calendar, 6.15, 2.0, 6.35, 2.88, { crop: false });
  pill(s, "CLIENTS", 0.86, 5.58, 0.9, C.blue, C.paleBlue);
  pill(s, "CALENDAR", 6.35, 5.18, 1.12, C.orange, C.orangePale);
  addText(s, "The operating rhythm of the agency lives here.", 6.35, 5.62, 4.6, 0.3, { fontSize: 14, bold: true });
}

// 6 — Property Management
{
  const s = addSlide();
  title(s, "05 · Property management", "The inventory is not a database. It is an active workspace.", "Property, contract, documents, incidents, communications, history—connected.");
  addScreenshot(s, img.property, 0.68, 1.94, 7.15, 3.85, { crop: false });
  addScreenshot(s, img.documents, 8.12, 1.94, 4.52, 2.66, { crop: false });
  addScreenshot(s, img.incidents, 8.12, 4.9, 4.52, 1.9, { crop: false });
  pill(s, "PROPERTY", 0.9, 5.98, 0.94, C.green, C.greenPale);
  addText(s, "From listing to lifecycle management.", 2.0, 5.98, 4.6, 0.3, { fontSize: 14, bold: true });
}

// 7 — Intelligent matching
{
  const s = addSlide();
  title(s, "06 · Intelligent matching", "Realista is not just a CRM.", "It actively connects intent with inventory—so the next best property is already in context.");
  rounded(s, 0.75, 2.0, 3.25, 3.6, C.paleBlue, C.paleBlue, 0.16, false);
  addText(s, "Client intent", 1.02, 2.35, 2.5, 0.32, { fontSize: 18, bold: true, color: C.blue });
  ["Budget", "Location", "Moving date", "Property type"].forEach((t, i) => {
    rounded(s, 1.02, 2.98 + i * 0.48, 2.42, 0.32, C.white, C.line, 0.1, false);
    addText(s, t, 1.18, 3.02 + i * 0.48, 2.0, 0.22, { fontSize: 11, color: C.muted });
  });
  arrow(s, 4.2, 3.56, 5.2, 3.56, C.blue, 2.8);
  rounded(s, 5.36, 2.5, 2.58, 2.62, C.white, C.line, 0.16, true);
  addText(s, "Matching layer", 5.68, 2.9, 1.95, 0.32, { fontSize: 17, bold: true, color: C.dark, align: "center" });
  addText(s, "Context turns search\ninto recommendation.", 5.68, 3.55, 1.95, 0.72, { fontSize: 13, color: C.muted, align: "center" });
  arrow(s, 8.15, 3.56, 9.1, 3.56, C.blue, 2.8);
  addScreenshot(s, img.propertyRent, 9.25, 2.0, 3.4, 3.6, { crop: false });
  pill(s, "RECOMMENDATION", 9.56, 5.78, 1.65, C.purple, C.purplePale);
}

// 8 — One platform
{
  const s = addSlide();
  title(s, "07 · One platform", "Every step is connected inside Realista.", "The value is not in any single screen. It is in the handoff-free journey.");
  const steps = [
    ["Client", C.blue, "01"], ["Property", C.green, "02"], ["Recommendation", C.orange, "03"], ["Visit", C.purple, "04"], ["Closing", C.dark, "05"],
  ];
  steps.forEach(([h, color, n], i) => {
    const x = 0.75 + i * 2.48;
    rounded(s, x, 2.65, 1.84, 1.1, i === 4 ? C.dark : C.white, i === 4 ? C.dark : C.line, 0.14, true);
    addText(s, n, x + 0.17, 2.83, 0.34, 0.25, { fontSize: 10, bold: true, color: i === 4 ? C.white : color });
    addText(s, h, x + 0.17, 3.2, 1.48, 0.3, { fontSize: 17, bold: true, color: i === 4 ? C.white : C.ink });
    if (i < steps.length - 1) arrow(s, x + 1.9, 3.2, x + 2.32, 3.2, color, 2.2);
  });
  addText(s, "No context switching. No duplicated records. No lost momentum.", 2.08, 4.6, 9.2, 0.5, { fontFace: "Aptos Display", fontSize: 24, bold: true, color: C.dark, align: "center" });
  addText(s, "Everything happens inside Realista.", 4.18, 5.35, 5.1, 0.35, { fontSize: 16, color: C.blue, bold: true, align: "center" });
}

// 9 — Vision
{
  const s = addSlide();
  title(s, "08 · Vision", "From CRM to Agency Operating System", "The platform expands across the customer journey—not just the transaction.");
  const items = [
    ["Lead", C.blue], ["Client", C.green], ["Property", C.orange], ["Transaction", C.purple], ["Move", C.red], ["Post-sale", C.dark],
  ];
  items.forEach(([h, color], i) => {
    const x = 0.75 + i * 2.1;
    const y = i % 2 === 0 ? 2.72 : 4.05;
    rounded(s, x, y, 1.55, 0.68, i === 5 ? C.dark : C.white, i === 5 ? C.dark : color, 0.14, true);
    addText(s, h, x, y + 0.16, 1.55, 0.3, { fontSize: 14, bold: true, color: i === 5 ? C.white : C.ink, align: "center" });
    if (i < items.length - 1) {
      const nextX = x + 1.68;
      const nextY = (i + 1) % 2 === 0 ? 3.06 : 4.39;
      line(s, x + 1.55, y + 0.34, nextX, nextY, color, 1.7);
    }
  });
  addShapeLabel(s, "The agency becomes the distribution layer for the entire home journey.", 2.4, 5.75, 8.55);
}

// 10 — AppPro fit
{
  const s = addSlide();
  title(s, "09 · AppPro inside Realista", "AppPro is not replaced. It becomes native.", "Realista is horizontal. AppPro is vertical. Together they cover the journey without context switching.");
  rounded(s, 0.75, 2.0, 3.05, 4.35, C.dark, C.dark, 0.18, true);
  addText(s, "REALISTA", 1.08, 2.27, 1.7, 0.28, { fontSize: 11, bold: true, color: C.white, charSpacing: 1.2 });
  ["Calendar", "Clients", "Messages", "Properties"].forEach((t, i) => {
    addText(s, "•  " + t, 1.06, 2.92 + i * 0.48, 2.0, 0.28, { fontSize: 14, color: "C8D8E5" });
  });
  rounded(s, 1.02, 5.05, 2.5, 0.66, C.blue, C.blue, 0.12, false);
  addText(s, "★  Services", 1.27, 5.2, 2.0, 0.3, { fontSize: 15, bold: true, color: C.white });
  addText(s, "Agent", 1.06, 5.88, 1.1, 0.22, { fontSize: 11, color: "C8D8E5" });
  addText(s, "Agency", 2.08, 5.88, 1.1, 0.22, { fontSize: 11, color: "C8D8E5" });
  arrow(s, 4.15, 4.15, 5.24, 4.15, C.blue, 3);
  rounded(s, 5.5, 2.45, 6.85, 3.38, C.white, C.line, 0.18, true);
  addText(s, "Home Services", 5.95, 2.88, 3.4, 0.44, { fontFace: "Aptos Display", fontSize: 25, bold: true, color: C.dark });
  pill(s, "POWERED BY APPPRO", 10.02, 2.95, 1.85, C.blue, C.paleBlue);
  addText(s, "When a client reaches the moving stage, the agent simply opens the Services workspace.", 5.98, 3.65, 5.5, 0.58, { fontSize: 15, color: C.muted, valign: "top" });
  ["Electricity", "Gas", "Internet", "Insurance", "Water"].forEach((t, i) => {
    const x = 5.98 + (i % 3) * 1.86;
    const y = 4.64 + Math.floor(i / 3) * 0.55;
    rounded(s, x, y, 1.55, 0.34, C.paleBlue, C.paleBlue, 0.1, false);
    addText(s, t, x, y + 0.06, 1.55, 0.2, { fontSize: 10, bold: true, color: C.blue, align: "center" });
  });
  note(s, "No duplicated client information. No duplicated property information.", 5.98, 5.72, 5.6);
}

// 11 — Future user journey
{
  const s = addSlide();
  title(s, "10 · Future journey", "Papernest enters before the move—and stays through it.", "The move becomes a moment in a much larger, already-contextualized customer journey.");
  const journey = [
    ["Lead", C.blue], ["Client created", C.green], ["Recommendations", C.orange], ["Visits", C.purple],
    ["Offer accepted", C.red], ["Move detected", C.dark], ["Home Services · AppPro", C.blue2], ["Customer moved", C.green],
  ];
  journey.forEach(([h, color], i) => {
    const x = 0.9 + (i % 4) * 3.04;
    const y = 2.0 + Math.floor(i / 4) * 1.7;
    rounded(s, x, y, 2.22, 0.72, i === 6 ? C.blue : C.white, i === 6 ? C.blue : color, 0.14, true);
    addText(s, h, x + 0.12, y + 0.18, 1.98, 0.3, { fontSize: 13, bold: true, color: i === 6 ? C.white : C.ink, align: "center" });
    if (i === 3) arrow(s, 11.26, y + 0.36, 11.74, y + 0.36, color, 1.8);
    else if (i < 3) arrow(s, x + 2.28, y + 0.36, x + 2.84, y + 0.36, color, 1.8);
  });
  ["Electricity", "Gas", "Internet", "Insurance", "Water"].forEach((t, i) => {
    pill(s, t, 1.06 + i * 2.38, 5.25, 1.65, C.blue, C.paleBlue);
  });
  addText(s, "Papernest becomes part of the complete customer journey.", 2.17, 6.08, 9.0, 0.38, { fontFace: "Aptos Display", fontSize: 22, bold: true, color: C.dark, align: "center" });
}

// 12 — Strategic value
{
  const s = addSlide();
  title(s, "11 · Strategic value", "A larger platform creates more valuable moments for Papernest.", "Four ways the operating layer compounds the value of AppPro.");
  card(s, "Earlier customer acquisition", "Present from the first agency interaction—not only at move-in.", 0.75, 2.1, 2.82, 2.28, C.blue, "↗");
  card(s, "Agency daily engagement", "Agents spend their day inside Realista, where services are one click away.", 3.76, 2.1, 2.82, 2.28, C.green, "◷");
  card(s, "Natural AppPro integration", "Home services become a native workflow, not a separate destination.", 6.77, 2.1, 2.82, 2.28, C.orange, "★");
  card(s, "More customer context", "Budget · location · moving date · property · intent—available earlier.", 9.78, 2.1, 2.82, 2.28, C.purple, "◎");
  addShapeLabel(s, "From owning the moving moment → to owning the journey that creates it.", 2.0, 5.55, 9.35);
}

// 13 — Product maturity
{
  const s = addSlide();
  title(s, "12 · Product maturity", "The core operating system is already in place.", "The next unlock is not rebuilding the foundation—it is activating more value on top of it.");
  const rows = [
    ["CRM", "READY"], ["Property Management", "READY"], ["Recommendations", "READY"], ["Messaging", "READY"],
    ["Calendar", "READY"], ["Agency Administration", "READY"], ["Client–Property Relationship", "READY"],
    ["Transaction Workspace", "FUTURE"], ["AI Copilot", "FUTURE"], ["Automation", "FUTURE"],
  ];
  rounded(s, 0.9, 1.95, 11.55, 4.55, C.white, C.line, 0.14, true);
  rows.forEach(([h, state], i) => {
    const y = 2.12 + i * 0.39;
    if (i > 0) line(s, 1.15, y - 0.08, 12.18, y - 0.08, "EEF2F6", 0.7);
    addText(s, h, 1.18, y, 6.4, 0.23, { fontSize: 11, color: C.ink, bold: state === "FUTURE" });
    pill(s, state, 10.82, y - 0.01, 1.05, state === "READY" ? C.green : C.purple, state === "READY" ? C.greenPale : C.purplePale);
  });
  addText(s, "The platform is broad enough for AppPro to land with leverage.", 1.1, 6.68, 7.2, 0.3, { fontSize: 14, bold: true, color: C.blue });
}

// 14 — Long-term platform vision
{
  const s = addSlide();
  title(s, "13 · Long-term platform vision", "One operating layer. A wider ecosystem.", "Realista owns the workflow; Papernest owns the service moments that follow.");
  rounded(s, 4.25, 1.82, 4.85, 0.72, C.dark, C.dark, 0.16, true);
  addText(s, "REALISTA", 4.25, 2.02, 4.85, 0.28, { fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.white, align: "center" });
  ["CRM", "Properties", "Calendar", "Messaging", "AI"].forEach((t, i) => pill(s, t, 2.22 + i * 1.8, 2.98, 1.35, C.blue, C.paleBlue));
  arrow(s, 6.68, 3.45, 6.68, 4.08, C.blue, 2.6);
  rounded(s, 3.36, 4.14, 6.62, 0.78, C.blue, C.blue, 0.16, true);
  addText(s, "HOME SERVICES · APPPRO", 3.36, 4.36, 6.62, 0.28, { fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.white, align: "center" });
  arrow(s, 6.68, 4.94, 6.68, 5.32, C.blue, 2.6);
  ["Electricity", "Gas", "Internet", "Insurance", "Water"].forEach((t, i) => pill(s, t, 1.75 + i * 2.02, 5.43, 1.55, C.green, C.greenPale));
  addShapeLabel(s, "Papernest ecosystem", 4.45, 6.22, 4.5);
}

// 15 — Closing
{
  const s = addSlide();
  s.background = { color: C.dark };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.dark }, line: { color: C.dark } });
  addLogo(s, 0.7, 0.35, true);
  pill(s, "THE THESIS", 10.85, 0.36, 1.55, C.white, "24435E");
  addText(s, "The Future of\nAgency Software", 0.78, 1.42, 5.2, 1.3, { fontFace: "Aptos Display", fontSize: 34, bold: true, color: C.white, valign: "top" });
  addText(s, "Realista provides the operating system for agencies.", 0.82, 3.22, 4.8, 0.5, { fontSize: 16, color: "D6E4EE" });
  addText(s, "AppPro becomes the native Home Services workspace.", 0.82, 3.88, 4.85, 0.5, { fontSize: 16, bold: true, color: "73C8EF" });
  addText(s, "Together, they enable Papernest to own the customer journey from the first property search to post-move services.", 0.82, 4.72, 4.95, 0.9, { fontSize: 14, color: "D6E4EE", valign: "top" });
  addScreenshot(s, hero, 6.05, 1.22, 6.45, 4.6, { crop: false, border: "24435E" });
  addText(s, "Realista × Papernest", 6.22, 6.18, 5.8, 0.35, { fontSize: 14, bold: true, color: "73C8EF", align: "center" });
}

const out = path.join(root, "exports", "realista-papernest-strategy-deck.pptx");
fs.mkdirSync(path.dirname(out), { recursive: true });
pptx.writeFile({ fileName: out });
console.log(out);