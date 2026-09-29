import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStatus, fromFirestoreDocument } from '../src/home.js';

const at = (weekday, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return { weekday, minutes: h * 60 + m };
};

test('水曜日は時間に関係なく定休日と表示する', () => {
  assert.equal(openStatus(at(3, '12:00')).state, 'closed');
  assert.match(openStatus(at(3, '12:00')).text, /定休日/);
});

test('営業時間の境界で営業中・準備中・終了を切り替える', () => {
  assert.deepEqual(openStatus(at(1, '9:30')), { state: 'closed', text: '準備中・11:00からカフェタイム' });
  assert.equal(openStatus(at(1, '10:15')).state, 'soon');
  assert.equal(openStatus(at(1, '11:00')).text, '営業中・カフェタイムは16:00まで');
  assert.equal(openStatus(at(1, '15:59')).state, 'open');
  assert.deepEqual(openStatus(at(1, '16:00')), { state: 'closed', text: '準備中・18:00からバルタイム' });
  assert.equal(openStatus(at(1, '17:30')).state, 'soon');
  assert.equal(openStatus(at(6, '22:59')).text, '営業中・バルタイムは23:00まで');
  assert.equal(openStatus(at(0, '23:00')).text, '本日の営業は終了しました');
});

test('Firestore REST の値をお知らせの項目に変換する', () => {
  const item = fromFirestoreDocument({
    fields: {
      title: { stringValue: '<b>限定</b>' },
      datetime: { stringValue: '2026-09-01' },
      image: { nullValue: null },
      updatedAt: { timestampValue: '2026-09-01T00:00:00Z' }
    }
  });
  assert.deepEqual(item, { title: '<b>限定</b>', datetime: '2026-09-01', image: null, updatedAt: '2026-09-01T00:00:00Z' });
  assert.deepEqual(fromFirestoreDocument({}), {});
});
