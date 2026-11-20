const DIRECTORY_URL = new URL('../data/directory.json', import.meta.url);
const ALLOWED_HOSTS = new Set(['github.com', 'ascendancy-systems.github.io']);

function safePublicURL(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) return null;
    return parsed.href;
  } catch { return null; }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function externalLink(entry) {
  const url = safePublicURL(entry.url);
  if (!url) return null;
  const link = el('a', '', `${entry.linkLabel} ↗`);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function setActionLink(linkNode, entry) {
  const url = entry && safePublicURL(entry.url);
  linkNode.hidden = !url;
  if (url) {
    linkNode.href = url;
    linkNode.textContent = `${entry.linkLabel} ↗`;
  } else {
    linkNode.removeAttribute('href');
  }
}

function init(data) {
  const entries = data.entries;
  let activeFilter = 'All';
  let query = '';

  const cards = document.querySelector('#directory-cards');
  const count = document.querySelector('#directory-count');
  const empty = document.querySelector('#directory-empty');
  const clerkResponse = document.querySelector('#clerk-response');
  const clerkLink = document.querySelector('#clerk-link');
  const mapLines = document.querySelector('#map-lines');
  const mapNodes = document.querySelector('#map-nodes');
  const mapTitle = document.querySelector('#map-detail-title');
  const mapDescription = document.querySelector('#map-detail-description');
  const mapLink = document.querySelector('#map-detail-link');

  function speak(message, entry = null) {
    clerkResponse.textContent = message;
    setActionLink(clerkLink, entry);
  }

  function showEntryAtDesk(entry) {
    speak(`${entry.title}. ${entry.detail}`, entry);
    document.querySelector('#front-desk').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderDirectory() {
    const terms = query.trim().toLocaleLowerCase();
    const visible = entries.filter((entry) =>
      (activeFilter === 'All' || entry.category === activeFilter) &&
      [entry.title, entry.summary, entry.detail, entry.category].some((field) => field.toLocaleLowerCase().includes(terms))
    );
    cards.replaceChildren();
    for (const entry of visible) {
      const article = el('article', 'directory-card');
      const top = el('div', 'card-top');
      top.append(el('span', 'card-number', entry.eyebrow));
      const statusClass = entry.status === 'Live demonstration' ? 'live' : 'orientation';
      top.append(el('span', `card-status ${statusClass}`, entry.status));
      article.append(top, el('h3', '', entry.title), el('p', '', entry.summary));

      const actions = el('div', 'card-actions');
      const link = externalLink(entry);
      if (link) actions.append(link);
      const ask = el('button', '', 'Ask the Clerk');
      ask.type = 'button';
      ask.setAttribute('aria-label', `Ask the Clerk about ${entry.title}`);
      ask.addEventListener('click', () => showEntryAtDesk(entry));
      actions.append(ask);
      article.append(actions);
      cards.append(article);
    }
    empty.hidden = visible.length !== 0;
    count.textContent = `${visible.length} of ${entries.length} destinations`;
  }

  const search = document.querySelector('#directory-query');
  search.addEventListener('input', () => { query = search.value; renderDirectory(); });
  const filters = [...document.querySelectorAll('[data-filter]')];
  function setFilter(filter) {
    activeFilter = filter;
    for (const button of filters) {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    renderDirectory();
  }
  for (const button of filters) button.addEventListener('click', () => setFilter(button.dataset.filter));

  function selectMapEntry(entry) {
    mapTitle.textContent = entry.title;
    mapDescription.textContent = entry.detail;
    setActionLink(mapLink, entry);
    for (const node of mapNodes.querySelectorAll('.map-node')) {
      const selected = node.dataset.entryId === entry.id;
      node.classList.toggle('selected', selected);
      node.setAttribute('aria-pressed', String(selected));
    }
  }

  function renderMap() {
    for (const entry of entries) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '500');
      line.setAttribute('y1', '295');
      line.setAttribute('x2', String(entry.map.x * 10));
      line.setAttribute('y2', String(entry.map.y * 5.9));
      mapLines.append(line);

      const node = el('button', 'map-node');
      node.type = 'button';
      node.dataset.entryId = entry.id;
      node.style.left = `${entry.map.x}%`;
      node.style.top = `${entry.map.y}%`;
      node.setAttribute('aria-pressed', 'false');
      node.setAttribute('aria-label', `Show ${entry.title} details`);
      node.append(el('small', '', entry.category), document.createTextNode(entry.title));
      node.addEventListener('click', () => selectMapEntry(entry));
      mapNodes.append(node);
    }
  }

  const script = {
    research() {
      setFilter('Research');
      search.value = ''; query = ''; renderDirectory();
      speak('Our research is organized publicly into six principal fields. Begin with the directory; each entry distinguishes orientation from an available publication.');
      document.querySelector('#directory').scrollIntoView({ behavior: 'smooth' });
    },
    instrument() {
      const gauge = entries.find((entry) => entry.id === 'meta-gauge');
      speak('The Meta-Gauge is our public experimental instrument demonstration. Its present geometry is simulation, not live research telemetry. You can open the viewer directly.', gauge);
    },
    publications() {
      speak('The institutional profile names several research works, but this Front Desk has not verified dedicated public editions. I will not offer a document as available until a public destination has been approved.');
    },
    map() {
      speak('The institutional map provides direct navigation among the currently listed fields, instrument, and public record. It is a wayfinding aid, not a claim about theoretical dependencies.');
      document.querySelector('#institutional-map').scrollIntoView({ behavior: 'smooth' });
    }
  };
  for (const button of document.querySelectorAll('[data-clerk-action]')) {
    button.addEventListener('click', () => script[button.dataset.clerkAction]());
  }

  renderDirectory();
  renderMap();
}

async function load() {
  try {
    const response = await fetch(DIRECTORY_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.entries) || data.entries.length === 0) throw new Error('Directory is empty');
    init(data);
  } catch (error) {
    console.error('Front Desk could not load the public directory:', error);
    document.querySelector('#load-error').hidden = false;
    document.querySelector('#directory-count').textContent = 'Directory unavailable';
    document.querySelector('#directory-empty').textContent = 'Please use the institutional profile links while the directory is unavailable.';
    document.querySelector('#directory-empty').hidden = false;
  }
}

load();
