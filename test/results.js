"use strict";
(() => {
  // src/web/results.ts
  var R = window.G3_RESULTS;
  var LABEL = {
    gt: "GT \u81EA\u68C0",
    g1: "G1\uFF08\u672A\u79FB\u690D\uFF09",
    opus: "Opus 5.5 \xB7 \u89C6\u9891",
    astra: "astra \xB7 \u89C6\u9891",
    opus_text: "Opus 5.5 \xB7 \u6587\u5B57",
    astra_text: "astra \xB7 \u6587\u5B57"
  };
  var h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    for (const c of kids) el.append(c);
    return el;
  };
  var pct = (x) => x == null ? "\u2014" : `${(x * 100).toFixed(1)}%`;
  function names() {
    return ["gt", "g1", ...Object.keys(R.metrics.summary).filter((n) => n !== "gt" && n !== "g1")];
  }
  function summaryTable() {
    const t = h("table", { class: "res" });
    t.append(h("thead", {}, h("tr", {}, ...["", "\u5B8C\u5168\u4E00\u81F4", "\u5BF9\u8BDD\u6D41\u7A0B\u4E00\u81F4", "\u5C04\u51FB\u72B6\u6001", "\u5BF9\u8BDD\u72B6\u6001", "\u753B\u9762", "build", "shooter \u672A\u6539", "\u7528\u65F6", "\u6539\u52A8"].map((x) => h("th", {}, x)))));
    const body = h("tbody");
    for (const n of names()) {
      const s = R.metrics.summary[n];
      const pixRates = Object.values(R.pixels ?? {}).map((c) => c[n]?.match_rate).filter((x) => x != null);
      const mads = Object.values(R.pixels ?? {}).map((c) => c[n]?.mean_abs_diff).filter((x) => x != null);
      const mad = mads.length ? ` \xB7 \u5747\u5DEE ${(mads.reduce((a, b) => a + b, 0) / mads.length).toFixed(2)}` : "";
      const ag = R.agents[n];
      const cells = [
        LABEL[n] ?? n,
        `${s.exact_cases} / ${s.cases}`,
        `${s.flow_match_cases} / ${s.cases}`,
        pct(s.shooter_rate),
        pct(s.dialogue_rate),
        n === "gt" ? "100%" : pixRates.length ? pct(pixRates.reduce((a, b) => a + b, 0) / pixRates.length) + mad : "\u2014",
        ag ? ag.build.ok ? "\u901A\u8FC7" : "\u5931\u8D25" : "\u2014",
        ag ? ag.files.shooter_unchanged ? "\u662F" : "\u5426" : "\u2014",
        ag ? `${ag.run.minutes} \u5206\u949F` : "\u2014",
        ag ? `+${ag.diff_stats.plus} / \u2212${ag.diff_stats.minus}` : "\u2014"
      ];
      body.append(h("tr", { class: n === "gt" || n === "g1" ? "ref" : "" }, ...cells.map((c, i) => h(i ? "td" : "th", {}, c))));
    }
    t.append(body);
    return t;
  }
  function flowList(gt, cand) {
    const box = h("div", { class: "flows" });
    const col = (title, xs, other) => h("div", {}, h("h4", {}, title), h("ol", {}, ...xs.map((x, i) => h("li", { class: other[i] === x ? "" : "bad" }, x.replace(/^守卫\|/, "")))));
    box.append(col("GT", gt, cand), col("\u5019\u9009", cand, gt));
    return box;
  }
  function caseView(cid) {
    const c = R.metrics.cases[cid];
    const wrap = h("div", { class: "case" });
    wrap.append(h("p", { class: "what" }, `${cid}\uFF1A${c.desc}\uFF08${c.ticks} tick\uFF09`));
    const cols = ["gt", ...names().filter((n) => n !== "gt" && n !== "g1" && R.pixels?.[cid]?.[n])];
    if (R.pixels?.[cid]) wrap.append(h("div", { class: "vlabels", style: `grid-template-columns: repeat(${cols.length}, 1fr)` }, ...cols.map((n) => h("span", {}, n === "gt" ? "GT" : LABEL[n] ?? n))));
    if (R.pixels?.[cid]) wrap.append(h("video", { src: `media/${R.run_id}/${cid}.mp4`, controls: "", muted: "", loop: "", playsinline: "", preload: "metadata" }));
    else wrap.append(h("p", { class: "what" }, "\u5BF9\u6BD4\u89C6\u9891\u5F55\u5236\u4E2D\u3002"));
    const t = h("table", { class: "res" });
    t.append(h("thead", {}, h("tr", {}, ...["", "\u5B8C\u5168\u4E00\u81F4", "\u5C04\u51FB\u72B6\u6001", "\u5BF9\u8BDD\u72B6\u6001", "\u753B\u9762", "\u6D41\u7A0B", "\u7B2C\u4E00\u6B21\u504F\u79BB"].map((x) => h("th", {}, x)))));
    const body = h("tbody");
    for (const n of names().filter((n2) => n2 !== "gt")) {
      const m = c.by[n];
      const fd = m.first_divergence;
      const div = fd ? `tick ${fd.tick} \xB7 ${fd.what} \xB7 GT ${JSON.stringify(fd.gt)} / \u5019\u9009 ${JSON.stringify(fd.cand)}` : "\u65E0";
      body.append(h(
        "tr",
        {},
        h("th", {}, LABEL[n] ?? n),
        h("td", {}, m.exact ? "\u662F" : "\u5426"),
        h("td", {}, pct(m.shooter_rate)),
        h("td", {}, pct(m.dialogue_rate)),
        h("td", {}, R.pixels?.[cid]?.[n] ? `${pct(R.pixels[cid][n].match_rate)} \xB7 \u5747\u5DEE ${R.pixels[cid][n].mean_abs_diff.toFixed(2)}` : "\u2014"),
        h("td", {}, m.flow_match ? "\u4E00\u81F4" : "\u4E0D\u4E00\u81F4"),
        h("td", { class: "div" }, div)
      ));
    }
    t.append(body);
    wrap.append(h("div", { class: "scroll" }, t));
    for (const n of names().filter((n2) => n2 !== "gt" && n2 !== "g1")) {
      if (!c.by[n].flow_match) {
        const d = h("details", {}, h("summary", {}, `${LABEL[n]} \u7684\u5BF9\u8BDD\u6D41\u7A0B vs GT`), flowList(c.by[n].flow_gt, c.by[n].flow_cand));
        wrap.append(d);
      }
    }
    return wrap;
  }
  function diffView(diff) {
    const pre = h("pre", { class: "diff" });
    for (const line of diff.split("\n")) {
      const cls = line.startsWith("diff ") ? "file" : line.startsWith("+++") || line.startsWith("---") ? "meta" : line.startsWith("@@") ? "hunk" : line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : "";
      pre.append(h("span", { class: cls }, line + "\n"));
    }
    return pre;
  }
  function codeView(agent) {
    const a = R.agents[agent];
    const wrap = h("div", { class: "code" });
    const f = a.files;
    wrap.append(h("p", { class: "what" }, `\u65B0\u589E ${f.added.length} \u4E2A\u6587\u4EF6\uFF0C\u4FEE\u6539 ${f.changed.length} \u4E2A\uFF0C\u5220\u9664 ${f.removed.length} \u4E2A\uFF1Bsrc/shooter ${f.shooter_unchanged ? "\u672A\u6539" : "\u6709\u6539\u52A8"}\uFF1Bsrc/core \u6539\u52A8\uFF1A${f.core_changed.join("\u3001") || "\u65E0"}`));
    wrap.append(h(
      "ul",
      { class: "files" },
      ...f.added.map((x) => h("li", { class: "add" }, "+ " + x)),
      ...f.changed.map((x) => h("li", { class: "mod" }, "~ " + x)),
      ...f.removed.map((x) => h("li", { class: "del" }, "\u2212 " + x))
    ));
    if (a["component_manifest.json"]) wrap.append(h("details", {}, h("summary", {}, "component_manifest.json"), h("pre", { class: "diff" }, a["component_manifest.json"])));
    if (a["NOTES.md"]) wrap.append(h("details", {}, h("summary", {}, "NOTES.md"), h("pre", { class: "diff" }, a["NOTES.md"])));
    if (!a.build.ok) wrap.append(h("details", {}, h("summary", {}, "build \u8F93\u51FA"), h("pre", { class: "diff" }, a.build.tail)));
    wrap.append(h("details", { open: "" }, h("summary", {}, `\u4EE3\u7801 diff\uFF08\u76F8\u5BF9\u5BFC\u51FA\u7684 G1 \u5305\uFF0C+${a.diff_stats.plus} / \u2212${a.diff_stats.minus}\uFF09`), diffView(a.diff)));
    return wrap;
  }
  function tabs(container, items, render, key) {
    const bar = h("div", { class: "chips", role: "tablist" });
    const pane = h("div");
    const show = (id) => {
      bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.id === id)));
      pane.replaceChildren(render(id));
      try {
        localStorage.setItem(key, id);
      } catch {
      }
    };
    for (const [id, label] of items) {
      const b = h("button", { class: "chip", type: "button", role: "tab", "data-id": id }, label);
      b.addEventListener("click", () => show(id));
      bar.append(b);
    }
    container.append(bar, pane);
    let start = items[0][0];
    try {
      const s = localStorage.getItem(key);
      if (s && items.some(([i]) => i === s)) start = s;
    } catch {
    }
    show(start);
  }
  var root = document.getElementById("results");
  if (root && R) {
    root.hidden = false;
    document.getElementById("res-summary").append(h("div", { class: "scroll" }, summaryTable()));
    tabs(document.getElementById("res-cases"), Object.keys(R.metrics.cases).map((c) => [c, c.split("_")[0]]), caseView, "sd-case");
    const ags = Object.keys(R.agents);
    if (ags.length) tabs(document.getElementById("res-code"), ags.map((a) => [a, LABEL[a] ?? a]), codeView, "sd-code");
  }
})();
