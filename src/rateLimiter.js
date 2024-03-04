const rateLimit = require('express-rate-limit');

// This function generates the rate limit table based on the given parameters.
const generateRateLimitTable = (params) => {
  const table = [];
  for (let i = 0; i < params.terms; i++) {
    const count = params.initialCount * Math.pow(params.countFactor, i);
    const window = params.initialWindow * Math.pow(params.windowFactor, i);
    const delay = window / count;
    table.push({ count, window, delay });
  }
  return table;
};

// Middleware to apply rate limits dynamically
function dynamicRateLimiter(params) {
  // Generate the rate limit table
  // const rateLimitTable = generateRateLimitTable({
  //   initialCount: 1,
  //   initialWindow: 1,
  //   countFactor: 2,
  //   windowFactor: 3,
  //   terms: 5, // Decreased the number of terms for illustration purposes
  // });
  // Expected output:
  // [
  //   { count: 1, window: 1, delay: 1 },
  //   { count: 2, window: 3, delay: 1.5 },
  //   { count: 4, window: 9, delay: 2.25 },
  //   { count: 8, window: 27, delay: 3.375 },
  //   { count: 16, window: 81, delay: 5.0625 }
  // ]
  const rateLimitTable = generateRateLimitTable(params);

  // Initialize rate limiters based on the rate limit table
  const limiters = rateLimitTable.map((limit) => {
    return rateLimit({
      windowMs: limit.window * 1000,
      max: limit.count,
      standardHeaders: false,
      legacyHeaders: false,
      handler: (req, res, next, options) => {
        // Customize behavior here to delay instead of sending a 429
        const delayMs = limit.delay * 1000;
        setTimeout(() => {
          next();
        }, delayMs);
      },
    });
  });

  return function (req, res, next) {
    // Execute limiters in sequence
    const executeSequence = (index) => {
      if (index >= limiters.length) {
        next();
        return;
      }
      limiters[index](req, res, () => executeSequence(index + 1));
    };

    executeSequence(0);
  };
}

module.exports = dynamicRateLimiter;