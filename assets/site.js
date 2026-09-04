import {
  defaultModuleOrder,
  filterModules,
  moduleNumber,
  moduleCategories,
  modules,
  moduleOrderOptions
} from "../modules/catalog.js?v=20260904-3";
import "./module-nav.js?v=20260904-3";

const grid = document.querySelector("#module-grid");
const orderSelect = document.querySelector("#module-order");
const moduleCount = document.querySelector("#module-count");
const moduleCountLabel = document.querySelector("#module-count-label");
const searchInput = document.querySelector("#module-search");
const categoryFilters = document.querySelector("#category-filters");

const requested = new URLSearchParams(window.location.search);
const requestedOrder = requested.get("order");
let order = moduleOrderOptions.some(({ id }) => id === requestedOrder)
  ? requestedOrder
  : defaultModuleOrder;
let category = moduleCategories.some(({ id }) => id === requested.get("category"))
  ? requested.get("category")
  : "";
let query = requested.get("q") ?? "";

function createModuleCard(module) {
  const card = document.createElement("article");
  card.className = "module-card";
  card.dataset.module = module.id;

  const number = document.createElement("div");
  number.className = "module-number";
  number.setAttribute("aria-hidden", "true");
  number.textContent = moduleNumber(module);

  const body = document.createElement("div");
  body.className = "module-card-body";

  const meta = document.createElement("div");
  meta.className = "module-meta";
  for (const item of [module.topic]) {
    const span = document.createElement("span");
    span.textContent = item;
    meta.append(span);
  }

  const heading = document.createElement("h2");
  heading.textContent = module.title;

  const description = document.createElement("p");
  description.textContent = module.description;

  const concepts = document.createElement("ul");
  concepts.className = "skill-list";
  concepts.setAttribute("aria-label", "Concepts covered");
  for (const concept of module.concepts) {
    const item = document.createElement("li");
    item.textContent = concept;
    concepts.append(item);
  }

  const action = document.createElement("a");
  action.className = "primary-action";
  action.href = module.href;
  action.innerHTML = `Open the lab <span aria-hidden="true">→</span>`;

  body.append(meta, heading, description, concepts, action);
  card.append(number, body);
  return card;
}

function updateURL() {
  const url = new URL(window.location.href);
  if (order === defaultModuleOrder) url.searchParams.delete("order");
  else url.searchParams.set("order", order);
  if (category) url.searchParams.set("category", category);
  else url.searchParams.delete("category");
  if (query.trim()) url.searchParams.set("q", query.trim());
  else url.searchParams.delete("q");
  window.history.replaceState({}, "", url);
}

function renderModules() {
  const visibleModules = filterModules({ query, category, order });
  if (visibleModules.length) {
    grid.replaceChildren(...visibleModules.map(createModuleCard));
  } else {
    const empty = document.createElement("div");
    empty.className = "catalog-empty";
    const heading = document.createElement("h2");
    heading.textContent = "No modules match those filters.";
    const note = document.createElement("p");
    note.textContent = "Try another subject or a broader search term.";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Clear filters";
    reset.addEventListener("click", () => {
      category = "";
      query = "";
      searchInput.value = "";
      updateCategoryButtons();
      renderModules();
      updateURL();
    });
    empty.append(heading, note, reset);
    grid.replaceChildren(empty);
  }

  moduleCount.textContent = visibleModules.length;
  moduleCountLabel.textContent = visibleModules.length === modules.length
    ? "standalone activities"
    : `of ${modules.length} activities`;
}

function updateCategoryButtons() {
  for (const button of categoryFilters.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.category === category));
  }
}

for (const option of moduleOrderOptions) {
  const element = document.createElement("option");
  element.value = option.id;
  element.textContent = option.label;
  orderSelect.append(element);
}

for (const option of [{ id: "", label: "All subjects" }, ...moduleCategories]) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.category = option.id;
  button.textContent = option.label;
  button.addEventListener("click", () => {
    category = option.id;
    updateCategoryButtons();
    renderModules();
    updateURL();
  });
  categoryFilters.append(button);
}

orderSelect.value = order;
searchInput.value = query;
updateCategoryButtons();
renderModules();

orderSelect.addEventListener("change", () => {
  order = orderSelect.value;
  renderModules();
  updateURL();
});

searchInput.addEventListener("input", () => {
  query = searchInput.value;
  renderModules();
  updateURL();
});
