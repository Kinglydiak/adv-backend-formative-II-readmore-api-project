const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

test('health endpoint returns a JSON status message', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: 'ReadMore API is running' });

  const missingRoute = await fetch(`http://127.0.0.1:${server.address().port}/missing`);
  assert.equal(missingRoute.status, 404);
  assert.match((await missingRoute.json()).message, /Route not found/);

  const invalidJson = await fetch(`http://127.0.0.1:${server.address().port}/books`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{'
  });
  assert.equal(invalidJson.status, 400);
  assert.deepEqual(await invalidJson.json(), { message: 'Request body contains invalid JSON' });
});
