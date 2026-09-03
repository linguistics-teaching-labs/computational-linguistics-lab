import { modules } from "../modules/catalog.js";
import "./module-nav.js";

const grid = document.querySelector("#module-grid");

for (const module of modules) {
  const card = document.createElement("article");
  card.className = "module-card";
  card.dataset.module = module.id;

  const number = document.createElement("div");
  number.className = "module-number";
  number.setAttribute("aria-hidden", "true");
  number.textContent = module.number;

  const body = document.createElement("div");
  body.className = "module-card-body";

  const meta = document.createElement("div");
  meta.className = "module-meta";
  for (const item of [module.topic, module.duration]) {
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
  grid.append(card);
}
