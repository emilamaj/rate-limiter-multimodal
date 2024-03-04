// Other tests, e.g., exceeding first limit, exceeding second, etc.
const express = require('express');
const request = require('supertest');
const rateLimiter = require('../src/rateLimiter');

describe('Multimodal Rate Limiter Middleware', () => {
  it('Correctly receives a single request', done => {
    const app = express();

    app.use(rateLimiter({
      initialCount: 1, // 1 request
      initialWindow: 1, // per second
      countFactor: 2, // double the max. requests per window
      windowFactor: 3, // triple the window size
      terms: 9, // 9 modes
    }));

    app.get('/', (req, res) => res.status(200).end());

    request(app)
      .get('/')
      .expect(200, done);
  });

  it('Delays requests that exceed the rate limit for different time windows', async () => {
    const app = express();

    app.use(rateLimiter({
      initialCount: 1, // 1 request
      initialWindow: 1, // per second
      countFactor: 2, // double the max. requests per window
      windowFactor: 3, // triple the window size
      terms: 7, // 7 modes
    }));

    // Set up a dummy route that always returns 200 OK
    app.get('/', (req, res) => res.status(200).end());

    // Measure the time it takes to perform 9 requests
    const tolerance = 0.1; // 10% tolerance
    const ceilings = [0, 1, 1.5, 1.5, 2.25, 2.25, 2.25, 3.375];
    // request 1: 0 seconds
    // request 2: 0 + 1 = 1 second
    // request 3: 1 + 1.5 = 2.5 seconds
    // request 4: 2.5 + 1.5 = 4 seconds
    // request 5: 4 + 2.25 = 6.25 seconds
    // request 6: 6.25 + 2.25 = 8.5 seconds
    // request 7: 8.5 + 2.25 = 10.75 seconds

    const begin = Date.now();
    for (let i = 0; i < 7; i++) {
      const start = Date.now();
      // Synchronous request to the dummy route, waiting for a response
      await request(app).get('/').expect(200);
      const end = Date.now();
      const elapsed = (end - start) / 1000;
      console.log(`Request ${i + 1} took ${elapsed} seconds, time since start: ${(end - begin) / 1000} seconds`);

      // Check if the request took longer than expected
      if (Math.abs(elapsed - ceilings[i]) > tolerance * (1 + ceilings[i])) {
        throw new Error(`Request ${i + 1} took longer than expected, ${elapsed} seconds, ceiling: ${ceilings[i]}, tolerance: ${tolerance * 100}%`);
      }
    }
  }, 20000); // Increase the timeout to 20000 milliseconds (or 20 seconds).
});
