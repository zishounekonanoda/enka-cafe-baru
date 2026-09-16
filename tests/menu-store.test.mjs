import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMenuStore, updateMenuItem } from '../src/menu-store.mjs';

const original = { groups: [{ id: 'lunch', sections: [
  { id: 'a', items: [{ name: 'コーヒー', price: '¥520' }] },
  { id: 'b', items: [{ name: 'パニーニ', price: '¥1080' }] }
] }] };
function harness(initial = original) {
  let remote = structuredClone(initial), writes = 0, failRead = false, failSave = false;
  const store = createMenuStore({
    read: async () => { if (failRead) throw Error('offline'); return structuredClone(remote); },
    transact: async callback => {
      if (failSave) throw Error('offline');
      await callback({ read: async () => structuredClone(remote), write: value => { remote = value; writes++; } });
    },
    stamp: () => 'server-time', revision: () => 'new-version'
  });
  return { store, get remote() { return remote; }, get writes() { return writes; },
    replace(value) { remote = structuredClone(value); },
    failRead(value) { failRead = value; }, failSave(value) { failSave = value; } };
}
test('読み込み前・取得失敗後には書き込めない', async () => {
  const h = harness();
  await assert.rejects(h.store.save(original), { code: 'menu-not-ready' });
  h.failRead(true);
  await assert.rejects(h.store.load());
  await assert.rejects(h.store.save(original), { code: 'menu-not-ready' });
  assert.equal(h.writes, 0);
});
test('再読込が失敗した場合も古い内容を保存できない', async () => {
  const h = harness(); await h.store.load(); h.failRead(true);
  await assert.rejects(h.store.load());
  assert.equal(h.store.ready, false);
  await assert.rejects(h.store.save(original));
});
test('未登録を正常確認した場合のみ新規作成できる', async () => {
  const h = harness(null); assert.equal(await h.store.load(), null);
  await h.store.save(original); assert.equal(h.writes, 1);
});
test('初期登録前に他の画面で作成されたら上書きしない', async () => {
  const h = harness(null); await h.store.load(); h.replace(original);
  await assert.rejects(h.store.save(original), { code: 'menu-conflict' });
  assert.equal(h.writes, 0);
});
test('旧クライアントの更新も内容比較で検出する', async () => {
  const h = harness(); await h.store.load();
  const newer = structuredClone(original); newer.groups[0].sections[0].items[0].price = '¥600'; h.replace(newer);
  await assert.rejects(h.store.save(original), { code: 'menu-conflict' });
  assert.equal(h.remote.groups[0].sections[0].items[0].price, '¥600');
  assert.equal(h.writes, 0); assert.equal(h.store.ready, false);
  await h.store.load(); await h.store.save(newer); assert.equal(h.writes, 1);
});
test('保存失敗で確定済みデータを汚さず再試行できる', async () => {
  const h = harness(); await h.store.load(); h.failSave(true);
  const draft = structuredClone(original); draft.groups[0].sections[0].items[0].name = '変更';
  await assert.rejects(h.store.save(draft));
  assert.deepEqual(h.store.data, original); assert.equal(h.store.ready, true);
  h.failSave(false); await h.store.save(draft); await h.store.save(draft);
  assert.equal(h.writes, 2);
});
test('トランザクションの再試行中に競合したら拒否する', async () => {
  let writes = 0;
  const store = createMenuStore({ read: async () => original, stamp: () => '', revision: () => 'v',
    transact: async callback => {
      await callback({ read: async () => original, write: () => {} });
      await callback({ read: async () => ({ ...original, revision: 'other' }), write: () => writes++ });
    }
  });
  await store.load(); await assert.rejects(store.save(original), { code: 'menu-conflict' });
  assert.equal(writes, 0);
});
test('ログアウト後に遅い読み込み結果を採用しない', async () => {
  let resolve;
  const store = createMenuStore({ read: () => new Promise(r => resolve = r) });
  const pending = store.load(); store.reset(); resolve(original);
  await assert.rejects(pending, { code: 'menu-stale' }); assert.equal(store.ready, false);
});
test('別セクションへの移動で移動先商品を残し元商品を除去する', () => {
  const group = structuredClone(original.groups[0]);
  updateMenuItem(group, { groupId: 'lunch', sectionId: 'a', index: 0 }, 'b', { name: '新コーヒー' });
  assert.equal(group.sections[0].items.length, 0);
  assert.deepEqual(group.sections[1].items.map(item => item.name), ['パニーニ', '新コーヒー']);
});
test('同セクションでの編集・新規追加・存在しない編集対象を区別する', () => {
  const group = structuredClone(original.groups[0]);
  updateMenuItem(group, { groupId: 'lunch', sectionId: 'a', index: 0 }, 'a', { name: '改訂' });
  updateMenuItem(group, null, 'a', { name: '追加' });
  assert.deepEqual(group.sections[0].items.map(item => item.name), ['改訂', '追加']);
  assert.throws(() => updateMenuItem(group, { groupId: 'other', sectionId: 'a', index: 0 }, 'b', {}));
  assert.equal(group.sections[1].items[0].name, 'パニーニ');
});
