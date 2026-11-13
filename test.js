const assert = require('assert');
const http = require('http');
const app = require('./app');
const { getDb } = require('./database/db');

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
  const db = await getDb();
  await db.exec('DELETE FROM rentals; DELETE FROM cameras; DELETE FROM photographers;');

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));

  try {
    const photoMissing = await request(server, 'POST', '/photographers', { phone: '1234567890' });
    assert.strictEqual(photoMissing.status, 400);

    const photoRes1 = await request(server, 'POST', '/photographers', { name: 'Pavan D', phone: '9876543210' });
    assert.strictEqual(photoRes1.status, 201);
    assert.strictEqual(photoRes1.body.name, 'Pavan D');
    const photographer1Id = photoRes1.body.id;

    const photoRes2 = await request(server, 'POST', '/photographers', { name: 'Pranav Reddy', phone: '9123456789' });
    assert.strictEqual(photoRes2.status, 201);
    const photographer2Id = photoRes2.body.id;

    const allPhotos = await request(server, 'GET', '/photographers');
    assert.strictEqual(allPhotos.status, 200);
    assert.strictEqual(allPhotos.body.length, 2);

    const onePhoto = await request(server, 'GET', `/photographers/${photographer1Id}`);
    assert.strictEqual(onePhoto.status, 200);
    assert.strictEqual(onePhoto.body.name, 'Pavan D');

    const photo404 = await request(server, 'GET', '/photographers/9999');
    assert.strictEqual(photo404.status, 404);

    const t1 = await request(server, 'POST', '/cameras', { name: 'Nikon D750', kind: 'DSLR' });
    assert.strictEqual(t1.status, 201);
    assert.strictEqual(t1.body.kind, 'DSLR');
    const cameraId = t1.body.id;
    console.log('PASS: Test 1 - POST /cameras with kind DSLR -> 201');

    const t2 = await request(server, 'POST', '/cameras', { name: 'Polaroid Fun', kind: 'Other' });
    assert.strictEqual(t2.status, 400);
    assert.strictEqual(t2.body.error.includes('Allowed values'), true);
    console.log('PASS: Test 2 - POST /cameras with kind Other -> 400 with allowed values');

    const t3 = await request(server, 'PUT', `/cameras/${cameraId}`, { kind: 'Mirrorless' });
    assert.strictEqual(t3.status, 200);
    assert.strictEqual(t3.body.kind, 'Mirrorless');
    console.log('PASS: Test 3 - PUT /cameras/:id updating kind to Mirrorless -> 200');

    await request(server, 'POST', '/cameras', { name: 'GoPro Hero 12', kind: 'Action' });
    await request(server, 'POST', '/cameras', { name: 'Canon 5D Mark IV', kind: 'DSLR' });

    const filterRes = await request(server, 'GET', '/cameras?kind=Mirrorless');
    assert.strictEqual(filterRes.status, 200);
    assert.strictEqual(filterRes.body.every(c => c.kind === 'Mirrorless'), true);
    console.log('PASS: GET /cameras?kind=Mirrorless query filtering -> 200');

    const rentalDate = '2026-11-20';
    const rent1 = await request(server, 'POST', '/rentals', {
      photographer_id: photographer1Id,
      camera_id: cameraId,
      rental_date: rentalDate
    });
    assert.strictEqual(rent1.status, 201);
    assert.strictEqual(rent1.body.camera_id, cameraId);
    console.log('PASS: POST /rentals valid booking -> 201');

    const rentDouble = await request(server, 'POST', '/rentals', {
      photographer_id: photographer2Id,
      camera_id: cameraId,
      rental_date: rentalDate
    });
    assert.strictEqual(rentDouble.status, 409);
    assert.strictEqual(rentDouble.body.error.includes('already booked'), true);
    console.log('PASS: Prevent same-camera double-booking on same date -> 409');

    const rentInvalidPhotographer = await request(server, 'POST', '/rentals', {
      photographer_id: 9999,
      camera_id: cameraId,
      rental_date: '2026-11-21'
    });
    assert.strictEqual(rentInvalidPhotographer.status, 404);

    const rentInvalidCamera = await request(server, 'POST', '/rentals', {
      photographer_id: photographer1Id,
      camera_id: 9999,
      rental_date: '2026-11-21'
    });
    assert.strictEqual(rentInvalidCamera.status, 404);

    const joinRes = await request(server, 'GET', '/rentals');
    assert.strictEqual(joinRes.status, 200);
    assert.strictEqual(Array.isArray(joinRes.body), true);
    assert.strictEqual(joinRes.body.length > 0, true);
    assert.strictEqual(joinRes.body[0].photographer_name, 'Pavan D');
    assert.strictEqual(joinRes.body[0].camera_name, 'Nikon D750');
    console.log('PASS: GET /rentals SQL JOIN with photographer_name & camera_name -> 200');

    const deleteCamera = await request(server, 'DELETE', `/cameras/${cameraId}`);
    assert.strictEqual(deleteCamera.status, 200);
    const deleteAgain = await request(server, 'DELETE', `/cameras/${cameraId}`);
    assert.strictEqual(deleteAgain.status, 404);
    console.log('PASS: DELETE /cameras/:id -> 200 and 404');

    console.log('\nAll LensLab Studio specifications and tests passed successfully!');
  } finally {
    server.close();
  }
};

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
