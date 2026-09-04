import {
  getModulesByCategory,
  moduleCategories
} from "../modules/catalog.js?v=20260904-3";

function buildNavigation(navigation) {
  const root = navigation.dataset.root ?? "./";
  const active = navigation.dataset.active ?? "";

  const home = document.createElement("a");
  home.className = "nav-home";
  home.href = root;
  home.textContent = "Home";
  if (!active) home.setAttribute("aria-current", "page");

  const menu = document.createElement("details");
  menu.className = "browse-menu";

  const summary = document.createElement("summary");
  summary.textContent = "Browse modules";
  if (active) summary.classList.add("contains-current");

  const panel = document.createElement("div");
  panel.className = "browse-panel";

  for (const category of moduleCategories) {
    const group = document.createElement("section");
    group.className = "browse-group";
    group.setAttribute("aria-labelledby", `nav-category-${category.id}`);

    const heading = document.createElement("h2");
    heading.id = `nav-category-${category.id}`;
    heading.textContent = category.label;

    const links = document.createElement("div");
    links.className = "browse-links";

    for (const module of getModulesByCategory(category.id)) {
      const link = document.createElement("a");
      link.href = `${root}${module.href}`;
      link.textContent = module.title;
      if (module.id === active) link.setAttribute("aria-current", "page");
      links.append(link);
    }

    group.append(heading, links);
    panel.append(group);
  }

  menu.append(summary, panel);
  navigation.replaceChildren(home, menu);

  document.addEventListener("pointerdown", event => {
    if (menu.open && !menu.contains(event.target)) menu.removeAttribute("open");
  });

  menu.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      menu.removeAttribute("open");
      summary.focus();
    }
  });
}

for (const navigation of document.querySelectorAll("[data-module-nav]")) {
  buildNavigation(navigation);
}
