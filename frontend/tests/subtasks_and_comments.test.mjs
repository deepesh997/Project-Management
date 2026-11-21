import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/lib/api.ts';

test('Assessment Suite: Frontend Subtasks and Team Comments', async (t) => {
  await t.test('ApiClient.getSubtasks returns seeded subtasks with progress tracking', async () => {
    const subtasks = await ApiClient.getSubtasks('task-103');
    assert.ok(Array.isArray(subtasks));
    assert.ok(subtasks.length >= 3);
    assert.equal(typeof subtasks[0].isCompleted, 'boolean');
    assert.ok(subtasks[0].title);
  });

  await t.test('ApiClient.createSubtask creates and returns new subtask with fallback', async () => {
    const res = await ApiClient.createSubtask('task-103', 'Write Jest frontend component tests');
    assert.equal(res.success, true);
    assert.ok(res.subtask);
    assert.equal(res.subtask.title, 'Write Jest frontend component tests');
    assert.equal(res.subtask.isCompleted, false);
  });

  await t.test('ApiClient.getComments returns active discussion thread', async () => {
    const comments = await ApiClient.getComments('task-103');
    assert.ok(Array.isArray(comments));
    assert.ok(comments.length >= 2);
    assert.ok(comments[0].authorName);
    assert.ok(comments[0].content);
  });

  await t.test('ApiClient.createComment posts and creates comment item', async () => {
    const res = await ApiClient.createComment('task-103', 'Reviewed architecture for OCC locking.');
    assert.equal(res.success, true);
    assert.ok(res.comment);
    assert.equal(res.comment.content, 'Reviewed architecture for OCC locking.');
  });
});
