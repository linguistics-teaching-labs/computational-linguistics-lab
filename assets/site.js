import {
  defaultModuleOrder,
  getModules,
  moduleNumber,
  moduleOrderOptions
} from "../modules/catalog.js";
import "./module-nav.js";

const grid = document.querySelector("#module-grid");
const orderSelect = document.querySelector("#module-order");
const moduleCount = document.querySelector("#module-count");

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

function renderModules(order) {
  grid.replaceChildren(...getModules(order).map(createModuleCard));
}

for (const option of moduleOrderOptions) {
  const element = document.createElement("option");
  element.value = option.id;
  element.textContent = option.label;
  orderSelect.append(element);
}

const requestedOrder = new URLSearchParams(window.location.search).get("order");
const initialOrder = moduleOrderOptions.some(({ id }) => id === requestedOrder)
  ? requestedOrder
  : defaultModuleOrder;

orderSelect.value = initialOrder;
moduleCount.textContent = getModules().length;
renderModules(initialOrder);

orderSelect.addEventListener("change", () => {
  renderModules(orderSelect.value);
  const url = new URL(window.location.href);
  if (orderSelect.value === defaultModuleOrder) url.searchParams.delete("order");
  else url.searchParams.set("order", orderSelect.value);
  window.history.replaceState({}, "", url);
});
