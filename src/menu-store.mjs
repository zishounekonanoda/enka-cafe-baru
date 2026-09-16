// Compare content as well as revision so saves by older clients are detected.
function contentKey(data) {
  if (data === null) return null;
  const { updatedAt, ...content } = data;
  const stable = value => Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
      : value;
  return JSON.stringify(stable(content));
}

function failure(code) {
  return Object.assign(new Error(code), { code });
}

export function createMenuStore({ read, transact, stamp, revision = () => crypto.randomUUID() }) {
  let data = null;
  let ready = false;
  let busy = false;
  let generation = 0;
  return {
    get ready() { return ready && !busy; },
    get data() { return structuredClone(data); },
    reset() { generation++; ready = false; busy = false; data = null; },
    async load() {
      if (busy) throw failure("menu-busy");
      const token = ++generation;
      ready = false;
      busy = true;
      try {
        const result = await read();
        if (token !== generation) throw failure("menu-stale");
        data = result;
        ready = true;
        return structuredClone(data);
      } finally {
        if (token === generation) busy = false;
      }
    },
    async save(candidate) {
      if (!ready || busy) throw failure("menu-not-ready");
      const token = generation;
      const expected = contentKey(data);
      const payload = { ...structuredClone(candidate), revision: revision() };
      busy = true;
      try {
        await transact(async transaction => {
          const latest = await transaction.read();
          if (token !== generation) throw failure("menu-stale");
          if (contentKey(latest) !== expected) throw failure("menu-conflict");
          transaction.write({ ...payload, updatedAt: stamp() });
        });
        if (token !== generation) throw failure("menu-stale");
        data = payload;
        return structuredClone(data);
      } catch (error) {
        if (token === generation && error.code === "menu-conflict") ready = false;
        throw error;
      } finally {
        if (token === generation) busy = false;
      }
    }
  };
}

export function updateMenuItem(group, origin, destinationId, item) {
  const destination = group?.sections.find(section => section.id === destinationId);
  if (!destination) throw failure("menu-section-missing");
  if (!origin) { destination.items.push(item); return; }
  const source = group.sections.find(section => section.id === origin.sectionId);
  if (origin.groupId !== group.id || !Number.isInteger(origin.index) || !source?.items[origin.index]) {
    throw failure("menu-item-missing");
  }
  if (source === destination) source.items[origin.index] = item;
  else {
    source.items.splice(origin.index, 1);
    destination.items.push(item);
  }
}
