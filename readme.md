# Multimodal rate-limiter middleware for Express.js
This simple middleware is designed to limit the rate of requests to an Express.js server.
It allows developers to limit the rate of requests on multiple time scales, allowing for much tighter limits on large time scales, and looser limits on smaller time scales.
This makes the experience much smoother for zealous users, without straining the server.
Currently, the middleware always throttles the requests, but it could be easily modified to return a 429 status code instead.

## How to use
The rate limits at different time scales are defined by geometric progression:
The number of requests allowed in the first time scale is defined by the `initialCount` parameter, as well as the `initialWindow` parameter, which defines the time window in seconds.
At initialisation, the middleware will use `countFactor` and `windowFactor` to calculate the number of requests allowed in the next time scale, and so on, until the number of requests allowed in the last time scale is defined by the `terms` parameter.

As an example, if we set
 - `initialCount` = 5
- `initialWindow` = 1
- `countFactor` = 2
- `windowFactor` = 3
- `terms` = 10

We will have the following rate limits:
- max. 5 requests per second
- but also max. 10 requests per 3 seconds
- 20 requests per 9 seconds
- 40 requests per 27 seconds
- 80 requests per 81 seconds (1 minute)
- 160 requests per 243 seconds (4 minutes)
- 320 requests per 729 seconds (12 minutes)
- 640 requests per 2187 seconds (36 minutes)
- 1280 requests per 6561 seconds (1 hour)
- 2560 requests per 19683 seconds (5 hours)

## Installation

```bash
npm install express-multimodal-rate-limiter
```

## Usage

```javascript
const express = require('express');
const rateLimiter = require('express-multimodal-rate-limiter');

// Define dummy app
const app = express();
app.use(rateLimiter({
  initialCount: 5,
  initialWindow: 1,
  countFactor: 2,
  windowFactor: 3,
  terms: 10
}));

// Define dummy route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Now the server will only allow 5 requests per second, but also 10 requests per 3 seconds, 20 requests per 9 seconds, etc.