import { modules } from "../modules/catalog.js";

for (const navigation of document.querySelectorAll("[data-module-nav]")) {
  const root = navigation.dataset.root ?? "./";
  const active = navigation.dataset.active ?? "";
  for (const module of modules) {
    const link = document.createElement("a");
    link.href = `${root}${module.href}`;
    link.innerHTML = `<span class="module-nav-number">${module.number}</span><span class="module-nav-label">${module.shortTitle}</span>`;
    if (module.id === active) link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
}
