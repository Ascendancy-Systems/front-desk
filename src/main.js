const DIRECTORY_URL = new URL('../data/directory.json', import.meta.url);
const ALLOWED_HOSTS = new Set(['github.com', 'ascendancy-systems.github.io']);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function safePublicURL(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendDestination(container, entry, className = 'text-link') {
  const url = entry.destination.kind === 'link' && safePublicURL(entry.destination.url);
  if (!url) {
    container.append(make('span', 'destination-concept', entry.destination.label));
    return;
  }
  const link = make('a', className, entry.destination.label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  container.append(link);
}

function init(data) {
  const entries = data.entries;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  let activeType = 'All';
  let query = '';

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = {
    directory: document.querySelector('#directory-panel'),
    map: document.querySelector('#map-panel')
  };
  const cards = document.querySelector('#directory-cards');
  const count = document.querySelector('#directory-count');
  const empty = document.querySelector('#directory-empty');
  const search = document.querySelector('#directory-query');
  const typeSelect = document.querySelector('#directory-type');
  const clerkResponse = document.querySelector('#clerk-response');
  const clerkLink = document.querySelector('#clerk-link');
  const mapLines = document.querySelector('#map-lines');
  const mapNodes = document.querySelector('#map-nodes');
  const mapType = document.querySelector('#map-detail-type');
  const mapTitle = document.querySelector('#map-detail-title');
  const mapDescription = document.querySelector('#map-detail-description');
  const mapFacts = document.querySelector('#map-detail-facts');
  const mapLink = document.querySelector('#map-detail-link');
  const mapConcept = document.querySelector('#map-detail-concept');

  function setView(view, { focus = false, updateHash = false } = {}) {
    for (const tab of tabs) {
      const selected = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    for (const [name, panel] of Object.entries(panels)) panel.hidden = name !== view;
    if (updateHash) history.replaceState(null, '', view === 'map' ? '#map' : '#directory');
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setView(tab.dataset.view, { updateHash: true }));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      setView(tabs[next].dataset.view, { focus: true, updateHash: true });
    });
  });

  document.querySelectorAll('[data-open-view]').forEach((link) => {
    link.addEventListener('click', () => setView(link.dataset.openView));
  });

  for (const type of [...new Set(entries.map((entry) => entry.type))].sort()) {
    typeSelect.append(new Option(type === 'Canon' ? 'Canon & books' : type, type));
  }

  function sourceLabels(entry) {
    return entry.sourceIds.map((id) => data.sources.find((source) => source.id === id)?.label).filter(Boolean);
  }

  function selectEntry(entry) {
    mapType.textContent = entry.map.region === entry.type ? entry.type : `${entry.type} · ${entry.map.region}`;
    mapTitle.textContent = entry.title;
    mapDescription.textContent = entry.detail;
    mapFacts.replaceChildren();
    for (const [term, value] of [['Maturity', entry.maturity], ['Availability', entry.availability], ['Grounding', sourceLabels(entry).join(' · ')]]) {
      mapFacts.append(make('dt', '', term), make('dd', '', value));
    }
    mapLink.hidden = true;
    mapLink.removeAttribute('href');
    mapConcept.hidden = true;
    const url = entry.destination.kind === 'link' && safePublicURL(entry.destination.url);
    if (url) {
      mapLink.href = url;
      mapLink.textContent = entry.destination.label;
      mapLink.hidden = false;
    } else {
      mapConcept.textContent = entry.destination.label;
      mapConcept.hidden = false;
    }
    mapNodes.querySelectorAll('.map-node').forEach((node) => node.classList.toggle('selected', node.dataset.id === entry.id));
  }

  function directTo(entry) {
    clerkResponse.textContent = `${entry.title}. ${entry.summary} ${entry.destination.label}.`;
    const url = entry.destination.kind === 'link' && safePublicURL(entry.destination.url);
    clerkLink.hidden = !url;
    if (url) {
      clerkLink.href = url;
      clerkLink.textContent = entry.destination.label;
    } else {
      clerkLink.removeAttribute('href');
    }
    document.querySelector('#front-desk').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function renderDirectory() {
    const term = query.trim().toLocaleLowerCase();
    const visible = entries.filter((entry) => {
      const fields = [entry.title, entry.type, entry.maturity, entry.availability, entry.summary, entry.detail, entry.map.region];
      return (activeType === 'All' || entry.type === activeType) && fields.some((field) => field.toLocaleLowerCase().includes(term));
    });
    cards.replaceChildren();
    for (const entry of visible) {
      const article = make('article', 'directory-card');
      const head = make('div', 'card-head');
      head.append(make('span', `type-badge type-${entry.type.toLocaleLowerCase()}`, entry.type), make('span', 'availability', entry.availability));
      const title = make('h3', '', entry.title);
      const summary = make('p', 'card-summary', entry.summary);
      const facts = make('dl', 'card-facts');
      facts.append(make('dt', '', 'Maturity'), make('dd', '', entry.maturity), make('dt', '', 'Destination'), make('dd', '', entry.destination.kind === 'link' ? 'Accessible link' : 'Conceptual only'));
      const actions = make('div', 'card-actions');
      appendDestination(actions, entry);
      const ask = make('button', '', 'Ask the Clerk');
      ask.type = 'button';
      ask.addEventListener('click', () => directTo(entry));
      actions.append(ask);
      article.append(head, title, summary, facts, actions);
      cards.append(article);
    }
    count.textContent = `${visible.length} of ${entries.length} public orientations`;
    empty.hidden = visible.length !== 0;
  }

  for (const entry of entries) {
    const button = make('button', 'map-node');
    button.type = 'button';
    button.dataset.id = entry.id;
    button.style.left = `${entry.map.x}%`;
    button.style.top = `${entry.map.y}%`;
    button.append(make('small', '', entry.type), make('span', '', entry.title));
    button.addEventListener('click', () => selectEntry(entry));
    mapNodes.append(button);
  }

  const edges = new Set();
  for (const entry of entries) {
    for (const relation of entry.relations) {
      const target = byId.get(relation.target);
      if (!target) continue;
      const key = [entry.id, target.id].sort().join(':');
      if (edges.has(key)) continue;
      edges.add(key);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(entry.map.x * 10));
      line.setAttribute('y1', String(entry.map.y * 6.2));
      line.setAttribute('x2', String(target.map.x * 10));
      line.setAttribute('y2', String(target.map.y * 6.2));
      mapLines.append(line);
    }
  }

  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      activeType = button.dataset.route;
      typeSelect.value = activeType;
      query = '';
      search.value = '';
      setView('directory', { updateHash: true });
      renderDirectory();
      const first = entries.find((entry) => entry.type === activeType);
      clerkResponse.textContent = first ? `I have opened the ${button.textContent} perspective. The directory distinguishes public links from conceptual destinations and shows maturity and availability for each entry.` : 'That perspective is not currently available.';
      clerkLink.hidden = true;
      document.querySelector('#navigator').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  search.addEventListener('input', () => { query = search.value; renderDirectory(); });
  typeSelect.addEventListener('change', () => { activeType = typeSelect.value; renderDirectory(); });

  renderDirectory();
  selectEntry(entries[0]);
  if (location.hash === '#map') setView('map');
}

fetch(DIRECTORY_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`Directory request failed: ${response.status}`);
    return response.json();
  })
  .then(init)
  .catch((error) => {
    console.error(error);
    document.querySelector('#load-error').hidden = false;
    document.querySelector('#directory-count').textContent = 'Directory unavailable';
  });
