import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createMenuStore, updateMenuItem } from '../src/menu-store.mjs';

const seed = { groups: [{ id: 'lunch', title: 'ランチ', sections: [
  { id: 'a', title: '飲み物', items: [{ name: 'コーヒー', price: '500' }] },
  { id: 'b', title: '食事', items: [{ name: 'パニーニ', price: '1000' }] }
] }] };
seed.groups.push({ ...structuredClone(seed.groups[0]), id: 'dinner', title: 'ディナー' });

async function editor() {
  let remote = structuredClone(seed), failRead = false, failSave = false, authCallback, writes = 0;
  const nodes = new Map();
  const panel = { listeners: {}, addEventListener(type, cb) { this.listeners[type] = cb; },
    querySelectorAll() { return [...nodes.values()].filter(node => node.id.startsWith('menu-')); } };
  function element(id = '', dataset = {}) {
    return { id, dataset, value: '', innerHTML: '', textContent: '', disabled: false, listeners: {},
      classList: { add() {}, remove() {}, toggle() {} }, focus() {},
      closest(selector) { return selector === 'section' ? panel : selector === `#${id}` ? this : null; },
      addEventListener(type, callback) { this.listeners[type] = callback; } };
  }
  const html = readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], element(match[1]));
  const dynamic = new Map();
  const document = {
    getElementById: id => nodes.get(id),
    querySelectorAll(selector) {
      const found = [];
      const markup = [...nodes.values()].map(node => node.innerHTML).join('');
      for (const match of markup.matchAll(/<button\s+([^>]+)>/g)) {
        const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
        if (!attrs.class?.split(' ').includes(selector.slice(1))) continue;
        const data = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-'))
          .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]));
        found.push(element('', data));
      }
      dynamic.set(selector, found);
      return found;
    }
  };
  const snap = data => ({ exists: () => data !== null, data: () => structuredClone(data) });
  const context = vm.createContext({ document, structuredClone, URL, crypto, console,
    window: { location: { origin: 'http://localhost' }, scrollTo() {} }, confirm: () => true,
    createMenuStore, updateMenuItem, defaultMenuData: structuredClone(seed),
    initializeApp: () => ({}), getAuth: () => ({}), getFirestore: () => ({}), GoogleAuthProvider: class {},
    doc: () => ({}), collection: () => ({}), query: () => ({}), orderBy: () => ({}),
    getDoc: async () => snap({ active: true }), getDocs: async () => ({ docs: [] }),
    getDocFromServer: async () => { if (failRead) throw Error('offline'); return snap(remote); },
    serverTimestamp: () => 'server-time',
    runTransaction: async (_, callback) => {
      if (failSave) throw Error('offline');
      await callback({ get: async () => snap(remote), set: (_, value) => { remote = value; writes++; } });
    },
    onAuthStateChanged: (_, callback) => { authCallback = callback; }
  });
  const source = readFileSync(new URL('../src/admin.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '');
  vm.runInContext(source, context);
  await authCallback({ uid: 'test-admin', displayName: 'Test' });
  await new Promise(resolve => setImmediate(resolve));
  return { nodes, dynamic, get remote() { return remote; }, get writes() { return writes; },
    failRead(value) { failRead = value; }, failSave(value) { failSave = value; },
    async dispatch(node, type = 'click') {
      let stopped = false;
      const event = { target: node, preventDefault() {}, stopImmediatePropagation() { stopped = true; } };
      panel.listeners[type]?.(event);
      if (!stopped) await node.listeners[type]?.(event);
    } };
}

test('実際の編集フォームで商品を移動し、保存失敗後も入力を再送できる', async () => {
  const e = await editor();
  await e.dispatch(e.dynamic.get('.menu-edit-item')[0]);
  e.nodes.get('menu-item-section').value = 'b';
  e.nodes.get('menu-item-name').value = '改訂コーヒー';
  e.failSave(true);
  await e.dispatch(e.nodes.get('menu-item-form'), 'submit');
  assert.equal(e.writes, 0);
  assert.equal(e.nodes.get('menu-item-name').value, '改訂コーヒー');
  e.failSave(false);
  await e.dispatch(e.nodes.get('menu-item-form'), 'submit');
  assert.equal(e.remote.groups[0].sections[0].items.length, 0);
  assert.deepEqual(e.remote.groups[0].sections[1].items.map(item => item.name), ['パニーニ', '改訂コーヒー']);
  assert.equal(e.nodes.get('menu-item-name').value, '');
});

test('実際の画面で再読込失敗後の保存を遮断し、再読込成功で復旧する', async () => {
  const e = await editor(); e.failRead(true);
  await e.dispatch(e.nodes.get('menu-reload-btn'));
  assert.equal(e.nodes.get('menu-item-name').disabled, true);
  assert.equal(e.nodes.get('menu-reload-btn').disabled, false);
  await e.dispatch(e.nodes.get('menu-seed-btn'));
  assert.equal(e.writes, 0);
  e.failRead(false); await e.dispatch(e.nodes.get('menu-reload-btn'));
  assert.equal(e.nodes.get('menu-item-name').disabled, false);
  assert.equal(e.nodes.get('menu-seed-btn').hidden, true);
});

test('分類の削除が失敗した後も表示中の分類の商品を編集する', async () => {
  const e = await editor();
  await e.dispatch(e.dynamic.get('.menu-tab')[1]);
  e.failSave(true); await e.dispatch(e.nodes.get('menu-delete-group-btn'));
  e.failSave(false); await e.dispatch(e.dynamic.get('.menu-edit-item')[0]);
  e.nodes.get('menu-item-name').value = 'ディナー用';
  await e.dispatch(e.nodes.get('menu-item-form'), 'submit');
  assert.equal(e.remote.groups[0].sections[0].items[0].name, 'コーヒー');
  assert.equal(e.remote.groups[1].sections[0].items[0].name, 'ディナー用');
});
