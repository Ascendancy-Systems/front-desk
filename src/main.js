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
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  const research = entries.find((entry) => entry.id === 'research-disciplines');
  const researchFields = new Set(research.relations.filter((edge) => edge.kind === 'contains').map((edge) => edge.target));
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
  const mapPicker = document.querySelector('#map-entry');
  const mapTitle = document.querySelector('#map-detail-title');
  const mapRelations = document.querySelector('#map-relations');
  const mapSources = document.querySelector('#map-sources');
  const mapWindow = document.querySelector('#map-window');
  const mapNodes = new Map();
  const mapEdges = [];

  function revealNode() {
    const node = mapNodes.get(mapPicker.value);
    if (node && mapWindow.clientWidth) {
      mapWindow.scrollLeft = node.offsetLeft - mapWindow.clientWidth / 2;
    }
  }

  function setView(view, { focus = false, updateHash = false } = {}) {
    for (const tab of tabs) {
      const selected = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    for (const [name, panel] of Object.entries(panels)) panel.hidden = name !== view;
    if (view === 'map') revealNode();
    if (updateHash && location.hash !== '#' + view) history.pushState(null, '', '#' + view);
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
    typeSelect.append(new Option(({ Canon: 'Canon & books', Discipline: 'Research fields' })[type] || type, type));
  }

  function sourceLink(id) {
    const source = sources.get(id);
    const link = make('a', 'text-link', source.label);
    link.href = safePublicURL(source.url);
    return link;
  }

  function selectEntry(entry) {
    mapPicker.value = entry.id;
    for (const [id, node] of mapNodes) node.setAttribute('aria-pressed', String(id === entry.id));
    for (const { owner, target, line } of mapEdges) {
      line.classList.toggle('active', owner === entry.id || target === entry.id);
    }
    revealNode();
    document.querySelector('#map-detail-type').textContent = entry.type;
    mapTitle.textContent = entry.title;
    document.querySelector('#map-detail-summary').textContent = entry.summary;
    document.querySelector('#map-detail-description').textContent = entry.detail;
    const facts = document.querySelector('#map-detail-facts');
    facts.replaceChildren();
    for (const [label, value] of [['Map region', entry.map.region], ['Maturity', entry.maturity], ['Availability', entry.availability]]) {
      facts.append(make('dt', '', label), make('dd', '', value));
    }
    const destination = document.querySelector('#map-destination');
    destination.replaceChildren();
    appendDestination(destination, entry);
    mapSources.replaceChildren();
    for (const id of entry.sourceIds) {
      const item = make('li');
      item.append(sourceLink(id));
      mapSources.append(item);
    }
    mapRelations.replaceChildren();
    for (const owner of entries) {
      for (const relation of owner.relations) {
        if (owner !== entry && relation.target !== entry.id) continue;
        const outgoing = owner === entry;
        const neighbor = outgoing ? byId.get(relation.target) : owner;
        const label = relation.kind === 'contains'
          ? (outgoing ? 'Research field' : 'Field within')
          : (outgoing ? 'Listed in profile' : 'Listed by');
        const item = make('li');
        const button = make('button', 'map-neighbor', neighbor.title);
        button.type = 'button';
        button.addEventListener('click', () => {
          selectEntry(neighbor);
          mapTitle.focus();
        });
        item.append(make('span', 'edge-label', label), button, sourceLink(relation.sourceId));
        mapRelations.append(item);
      }
    }
    if (!mapRelations.childElementCount) mapRelations.append(make('li', '', 'No connection is documented here.'));
  }

  function directTo(entry) {
    clerkResponse.textContent = `${entry.title}. ${entry.detail}`;
    const url = entry.destination.kind === 'link' && safePublicURL(entry.destination.url);
    clerkLink.hidden = !url;
    if (url) {
      clerkLink.href = url;
      clerkLink.textContent = entry.destination.label;
    } else {
      clerkLink.removeAttribute('href');
    }
    clerkResponse.focus({ preventScroll: true });
    document.querySelector('#front-desk').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function renderDirectory() {
    const term = query.trim().toLocaleLowerCase();
    const visible = entries.filter((entry) => {
      const fields = [entry.title, entry.type, entry.maturity, entry.availability, entry.summary, entry.detail];
      const matchesResearch = activeType === 'Discipline' && researchFields.has(entry.id);
      return (activeType === 'All' || entry.type === activeType || matchesResearch) && fields.some((field) => field.toLocaleLowerCase().includes(term));
    });
    cards.replaceChildren();
    for (const entry of visible) {
      const article = make('article', 'directory-card');
      const head = make('div', 'card-head');
      head.append(make('span', `type-badge type-${entry.type.toLocaleLowerCase()}`, entry.type), make('span', 'availability', entry.availability));
      const title = make('h3', '', entry.title);
      const summary = make('p', 'card-summary', entry.summary);
      const facts = make('dl', 'card-facts');
      facts.append(make('dt', '', 'Maturity'), make('dd', '', entry.maturity));
      const actions = make('div', 'card-actions');
      appendDestination(actions, entry);
      const ask = make('button', '', 'Ask the Clerk');
      ask.type = 'button';
      ask.addEventListener('click', () => directTo(entry));
      actions.append(ask);
      article.append(head, title, summary, facts, actions);
      cards.append(article);
    }
    count.textContent = `${visible.length} of ${entries.length} entries`;
    empty.hidden = visible.length !== 0;
  }

  const nodeLayer = document.querySelector('#map-nodes');
  const lineLayer = document.querySelector('#map-lines');
  for (const entry of entries) {
    mapPicker.append(new Option(entry.title, entry.id));
    const node = make('button', 'map-node');
    node.type = 'button';
    node.dataset.entryId = entry.id;
    node.style.left = entry.map.x + '%';
    node.style.top = entry.map.y + '%';
    node.append(make('small', '', entry.type), make('span', '', entry.title));
    node.setAttribute('aria-controls', 'map-detail-title');
    node.addEventListener('click', () => {
      selectEntry(entry);
      mapTitle.focus();
    });
    mapNodes.set(entry.id, node);
    nodeLayer.append(node);

    for (const relation of entry.relations) {
      const target = byId.get(relation.target);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', entry.map.x + '%');
      line.setAttribute('y1', entry.map.y + '%');
      line.setAttribute('x2', target.map.x + '%');
      line.setAttribute('y2', target.map.y + '%');
      lineLayer.append(line);
      mapEdges.push({ owner: entry.id, target: target.id, line });
    }
  }
  mapPicker.addEventListener('change', () => selectEntry(byId.get(mapPicker.value)));
  document.querySelector('#map-return').addEventListener('click', () => mapNodes.get(mapPicker.value).focus());

  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      activeType = button.dataset.route;
      typeSelect.value = activeType;
      query = '';
      search.value = '';
      setView('directory', { updateHash: true });
      renderDirectory();
      clerkResponse.textContent = `I’ve opened ${button.textContent} in the directory.`;
      clerkLink.hidden = true;
      search.focus({ preventScroll: true });
      document.querySelector('#navigator').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  search.addEventListener('input', () => { query = search.value; renderDirectory(); });
  typeSelect.addEventListener('change', () => { activeType = typeSelect.value; renderDirectory(); });

  renderDirectory();
  selectEntry(entries[0]);
  function followHash() {
    const mapRequested = ['#map', '#institutional-map'].includes(location.hash);
    setView(mapRequested ? 'map' : 'directory');
    if (mapRequested || location.hash === '#directory') {
      document.querySelector(mapRequested ? '#map' : '#directory').scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', followHash);
  followHash();
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
