const assert = require('assert');
const http = require('http');
const app = require('./server');
const { init } = require('./db');

const request = (server, method, path, body = null) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : null;
  const req = http.request({
    hostname: '127.0.0.1',
    port: server.address().port,
    path,
    method,
    headers: payload ? {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    } : {}
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
      } catch {
        resolve({ status: res.statusCode, body: data });
      }
    });
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const runTests = async () => {
  await init();
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));

  try {
    const t1 = await request(server, 'POST', '/cameras', { name: 'Sony A7 IV', kind: 'DSLR' });
    assert.strictEqual(t1.status, 201);
    assert.strictEqual(t1.body.kind, 'DSLR');
    console.log('PASS: Test 1 - Add with kind DSLR -> 201');

    const t2 = await request(server, 'POST', '/cameras', { name: 'Vintage 35mm', kind: 'Other' });
    assert.strictEqual(t2.status, 400);
    assert.strictEqual(t2.body.error.includes('Allowed values'), true);
    console.log('PASS: Test 2 - Add with kind Other -> 400 with allowed values');

    const cameraId = t1.body.id;
    const t3 = await request(server, 'PUT', `/cameras/${cameraId}`, { kind: 'Mirrorless' });
    assert.strictEqual(t3.status, 200);
    assert.strictEqual(t3.body.kind, 'Mirrorless');
    console.log('PASS: Test 3 - Update to Mirrorless -> 200');

    const searchRes = await request(server, 'GET', '/cameras?kind=Mirrorless');
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(Array.isArray(searchRes.body), true);
    console.log('PASS: Query search cameras by kind -> 200');

    const joinRes = await request(server, 'GET', '/rentals/details');
    assert.strictEqual(joinRes.status, 200);
    assert.strictEqual(Array.isArray(joinRes.body), true);
    assert.strictEqual(joinRes.body.length > 0, true);
    assert.strictEqual(typeof joinRes.body[0].photographer_name, 'string');
    assert.strictEqual(typeof joinRes.body[0].camera_name, 'string');
    console.log('PASS: Join endpoint rentals with photographer & camera names -> 200');

    const rentalDate = '2026-12-15';
    const rent1 = await request(server, 'POST', '/rentals', {
      photographer_id: 1,
      camera_id: cameraId,
      rental_date: rentalDate
    });
    assert.strictEqual(rent1.status, 201);

    const rent2 = await request(server, 'POST', '/rentals', {
      photographer_id: 2,
      camera_id: cameraId,
      rental_date: rentalDate
    });
    assert.strictEqual(rent2.status, 409);
    console.log('PASS: Prevent same-camera double-booking on same date -> 409');

    const delRes = await request(server, 'DELETE', `/cameras/${cameraId}`);
    assert.strictEqual(delRes.status, 200);
    console.log('PASS: Delete camera -> 200');

    console.log('\nAll tests passed successfully!');
  } finally {
    server.close();
  }
};

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
