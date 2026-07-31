import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "/tmp/realista-deck";
const ASSETS = "/home/runner/workspace/attached_assets";
const W = 1280;
const H = 720;
const blue = "#0b87c5";
const navy = "#0a2238";
const green = "#1c9a57";
const ink = "#132238";
const muted = "#5d6b7b";
const pale = "#eef7fb";
const line = "#d9e3ea";

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function img(name) {
  const file = path.join(ASSETS, name);
  const ext = path.extname(file).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,${fs.readFileSync(file).toString("base64")}`;
}

function text(x, y, value, size = 24, fill = ink, weight = 400, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function multiline(x, y, lines, size = 22, fill = ink, lineHeight = 32, weight = 400) {
  return lines.map((lineText, i) => text(x, y + i * lineHeight, lineText, size, fill, weight)).join("");
}

function rect(x, y, width, height, fill, radius = 0, stroke = "none") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
}

function rule(x1, y1, x2, y2, stroke = line, width = 2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
}

function image(name, x, y, width, height, extra = "") {
  return `<image href="${img(name)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
}

function logo(x, y, size = 54) {
  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="14" fill="${blue}"/>`,
    `<path d="M ${x + size * .2} ${y + size * .47} L ${x + size * .5} ${y + size * .17} L ${x + size * .8} ${y + size * .47} V ${y + size * .82} H ${x + size * .2} Z" fill="none" stroke="white" stroke-width="4"/>`,
    `<rect x="${x + size * .39}" y="${y + size * .47}" width="${size * .22}" height="${size * .35}" rx="4" fill="${green}"/>`,
  ].join("");
}

function header(section, page) {
  return [
    logo(58, 34, 44),
    text(116, 65, "REALISTA", 22, navy, 700),
    text(1222, 62, `${String(page).padStart(2, "0")} / 10`, 14, muted, 700, "end"),
    text(58, 108, section.toUpperCase(), 12, blue, 700),
  ].join("");
}

function footer() {
  return [rule(58, 674, 1222, 674), text(58, 700, "Realista · Business product overview", 12, muted), text(1222, 700, "Confidential", 12, muted, 400, "end")].join("");
}

function page(content, bg = "#ffffff") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rect(0, 0, W, H, bg)}${content}</svg>`;
}

const slides = [];

slides.push(page([
  rect(0, 0, 600, H, navy),
  logo(74, 76, 76),
  text(74, 192, "REALISTA", 28, "#ffffff", 700),
  text(74, 288, "The operating system", 38, "#ffffff", 700),
  text(74, 338, "for modern real estate", 38, "#ffffff", 700),
  text(74, 388, "agencies", 38, "#ffffff", 700),
  multiline(74, 420, ["One connected workspace for listings,", "teams, clients, documents and growth."], 22, "#cfe7f4", 34),
  rect(74, 548, 236, 44, blue, 22),
  text(192, 577, "BUSINESS SUMMARY", 14, "#ffffff", 700, "middle"),
  logo(892, 150, 220),
  text(1002, 450, "A clearer path from lead", 28, navy, 700, "middle"),
  text(1002, 490, "to completed transaction", 28, blue, 700, "middle"),
  footer(),
].join("")));

slides.push(page([
  header("Executive value proposition", 2),
  text(58, 166, "One platform. Every agency advantage.", 38, navy, 700),
  multiline(58, 218, ["Realista helps agencies replace disconnected tools with a single operating layer", "that makes every listing, client interaction and team action easier to manage."], 20, muted, 30),
  rect(58, 310, 350, 234, pale, 16),
  text(86, 355, "CONTROL", 14, blue, 700),
  text(86, 398, "One source of truth", 25, navy, 700),
  multiline(86, 438, ["Properties, clients, documents,", "messages and activity in context."], 18, muted, 28),
  rect(465, 310, 350, 234, "#f6f8fa", 16),
  text(493, 355, "PRODUCTIVITY", 14, green, 700),
  text(493, 398, "Less admin per deal", 25, navy, 700),
  multiline(493, 438, ["Automated workflows, reusable", "data and fewer manual handoffs."], 18, muted, 28),
  rect(872, 310, 350, 234, "#f6f8fa", 16),
  text(900, 355, "GROWTH", 14, navy, 700),
  text(900, 398, "A stronger agency brand", 25, navy, 700),
  multiline(900, 438, ["Better discovery, trusted profiles,", "reviews and team visibility."], 18, muted, 28),
  footer(),
].join("")));

slides.push(page([
  header("The agency problem", 3),
  text(58, 166, "The cost of fragmented operations", 38, navy, 700),
  multiline(58, 218, ["Agency teams lose time when information lives across spreadsheets, inboxes,", "messaging apps, listing tools and local folders."], 20, muted, 30),
  rect(58, 310, 1164, 2, line),
  constBox(58, 348, "01", "Leads go cold", ["Follow-ups are missed when", "client context is scattered."], blue),
  constBox(356, 348, "02", "Listings drift", ["Details, images and status", "updates are hard to keep aligned."], green),
  constBox(654, 348, "03", "Compliance is manual", ["Documents are difficult to", "classify, find and share."], blue),
  constBox(952, 348, "04", "Teams lack visibility", ["Managers cannot see the", "full operating picture."], green),
  rect(58, 570, 1164, 52, navy, 12),
  text(640, 604, "Realista turns these disconnected tasks into one repeatable agency workflow.", 20, "#ffffff", 700, "middle"),
  footer(),
].join("")));

slides.push(page([
  header("The agency workflow", 4),
  text(58, 166, "From listing to closing — without losing context", 36, navy, 700),
  multiline(58, 216, ["A single connected journey helps agents move faster and gives leaders", "a reliable view of what is happening across the business."], 20, muted, 30),
  workflowStep(82, 342, "01", "Create & publish", "Structured property data, images and search-ready presentation.", blue),
  workflowStep(330, 342, "02", "Match & engage", "Manage leads, preferences, messages and appointments.", green),
  workflowStep(578, 342, "03", "Link & progress", "Connect clients to properties and track deal context.", blue),
  workflowStep(826, 342, "04", "Document & close", "Keep critical files, history and next actions together.", green),
  rule(152, 315, 1118, 315, blue, 4),
  [152, 400, 648, 896, 1118].map((x) => `<circle cx="${x}" cy="315" r="10" fill="${blue}"/>`).join(""),
  rect(58, 548, 1164, 54, pale, 12),
  text(640, 583, "The value compounds: every action creates reusable data for the next one.", 20, navy, 700, "middle"),
  footer(),
].join("")));

slides.push(page([
  header("Property operations", 5),
  text(58, 166, "Give every listing a complete operating record", 36, navy, 700),
  multiline(58, 216, ["Realista makes the property more than a listing: it becomes a structured workspace", "for the agent, the agency and every stakeholder involved."], 20, muted, 30),
  image("image_1744458256107.png", 58, 318, 430, 228),
  rect(510, 318, 712, 228, "#f6f8fa", 16),
  text(546, 360, "Property-level value", 20, navy, 700),
  bullet(546, 404, "Consistent property data and media", blue),
  bullet(546, 448, "Operational status and workflow context", green),
  bullet(546, 492, "Documents, incidents, communications and history", blue),
  bullet(546, 536, "A foundation for better search and matching", green),
  footer(),
].join("")));

slides.push(page([
  header("CRM and client management", 6),
  text(58, 166, "Make every client interaction actionable", 36, navy, 700),
  multiline(58, 216, ["Agents can understand the client, connect the right properties, capture the history", "and keep the next action visible — without switching systems."], 20, muted, 30),
  rect(58, 312, 490, 252, pale, 16),
  text(88, 358, "CLIENT 360°", 14, blue, 700),
  text(88, 402, "Context that travels", 26, navy, 700),
  multiline(88, 442, ["Preferences · status · contact history", "appointments · linked properties", "messages · documents"], 18, muted, 31),
  rect(588, 312, 634, 252, navy, 16),
  text(624, 358, "AGENCY OUTCOME", 14, "#8fd6f4", 700),
  text(624, 408, "More relevant conversations.", 26, "#ffffff", 700),
  text(624, 449, "Faster follow-up.", 26, "#ffffff", 700),
  text(624, 490, "Higher confidence at every step.", 26, "#ffffff", 700),
  footer(),
].join("")));

slides.push(page([
  header("Team productivity", 7),
  text(58, 166, "Turn individual work into agency capability", 36, navy, 700),
  multiline(58, 216, ["Realista gives agencies the operating tools to coordinate people, standardize work", "and manage performance as the business grows."], 20, muted, 30),
  image("targeted_element_1778694419560.png", 58, 312, 570, 300),
  rect(680, 312, 542, 300, "#f6f8fa", 16),
  text(720, 356, "Built for agency leadership", 22, navy, 700),
  bullet(720, 406, "Team and access management", blue),
  bullet(720, 452, "Working-time and absence controls", green),
  bullet(720, 498, "Centralized billing and seat-based plans", blue),
  bullet(720, 544, "Network and franchise-ready structure", green),
  footer(),
].join("")));

slides.push(page([
  header("Demand generation and trust", 8),
  text(58, 166, "Help agencies get discovered — and chosen", 36, navy, 700),
  multiline(58, 216, ["Realista connects search, agency presence, agent profiles and reviews so the public", "can move from discovery to trust with fewer unanswered questions."], 20, muted, 30),
  image("image_1744458256107.png", 58, 316, 540, 270),
  image("image_1744418931901.png", 650, 316, 572, 270),
  rect(58, 610, 1164, 36, pale, 10),
  text(640, 635, "A stronger public profile supports brand differentiation, local visibility and conversion.", 16, navy, 700, "middle"),
  footer(),
].join("")));

slides.push(page([
  header("Screenshots from the product", 9),
  text(58, 166, "A product experience built for clarity", 36, navy, 700),
  multiline(58, 216, ["Simple search, clear actions and decision-support tools make the experience easier", "for agents, managers and clients alike."], 20, muted, 30),
  image("image_1741984889465.png", 58, 316, 560, 220),
  image("image_1777803554111.png", 660, 316, 562, 220),
  text(58, 574, "Discovery", 18, navy, 700),
  text(660, 574, "Decision support", 18, navy, 700),
  multiline(58, 606, ["Public-facing search experience", "that makes the marketplace approachable."], 16, muted, 24),
  multiline(660, 606, ["A mortgage calculator helps clients", "understand affordability earlier."], 16, muted, 24),
  footer(),
].join("")));

slides.push(page([
  header("Business case", 10),
  text(58, 166, "Why agencies adopt Realista", 38, navy, 700),
  multiline(58, 218, ["Realista is not another isolated tool. It is the operating layer that helps an agency", "protect time, improve service quality and create a scalable way of working."], 20, muted, 30),
  constBox(58, 320, "01", "Protect time", ["Reduce repetitive admin and", "context switching."], blue),
  constBox(356, 320, "02", "Improve service", ["Make every client touchpoint", "more informed and consistent."], green),
  constBox(654, 320, "03", "See more clearly", ["Give leaders visibility across", "people, listings and pipeline."], blue),
  constBox(952, 320, "04", "Scale confidently", ["Support teams, agencies and", "network growth from one base."], green),
  rect(58, 560, 1164, 60, blue, 12),
  text(640, 598, "Realista: less operational friction, more focus on the deal.", 23, "#ffffff", 700, "middle"),
  footer(),
].join("")));

function constBox(x, y, number, title, lines, accent) {
  return [
    text(x, y + 14, number, 14, accent, 700),
    text(x, y + 56, title, 22, navy, 700),
    multiline(x, y + 94, lines, 17, muted, 26),
  ].join("");
}

function workflowStep(x, y, number, title, description, accent) {
  return [
    text(x, y, number, 14, accent, 700),
    text(x, y + 42, title, 21, navy, 700),
    multiline(x, y + 78, description.match(/.{1,34}(?:\s|$)/g)?.map((s) => s.trim()).filter(Boolean) || [description], 15, muted, 23),
  ].join("");
}

function bullet(x, y, label, accent) {
  return `${rect(x, y - 13, 10, 10, accent, 5)}${text(x + 24, y, label, 17, ink, 400)}`;
}

slides.forEach((svg, index) => {
  fs.writeFileSync(path.join(OUT_DIR, `page-${String(index + 1).padStart(2, "0")}.svg`), svg);
});

console.log(`Wrote ${slides.length} SVG pages to ${OUT_DIR}`);
