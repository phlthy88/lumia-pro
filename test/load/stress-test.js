import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 100 VUs over 1 minute
    { duration: '3m', target: 100 }, // Stay at 100 VUs for 3 minutes
    { duration: '1m', target: 0 },   // Ramp down to 0 VUs
  ],
  thresholds: {
    'http_req_duration{type:static}': ['p(95)<500'], // p95 < 500ms for static assets
    'http_req_failed': ['rate<0.01'], // Failures < 1%
  },
};

export default function () {
  const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:4173';

  // Define heavy assets
  const requests = [
    { method: 'GET', url: `${TARGET_URL}/`, tags: { type: 'static' } },
    { method: 'GET', url: `${TARGET_URL}/models/face_landmarker.task`, tags: { type: 'static' } },
    { method: 'GET', url: `${TARGET_URL}/wasm/vision_wasm_internal.wasm`, tags: { type: 'static' } },
    { method: 'GET', url: `${TARGET_URL}/luts/bw/kodak_tri-x_400.cube`, tags: { type: 'static' } },
  ];

  requests.forEach((req) => {
    const res = http.request(req.method, req.url, null, { tags: req.tags });
    check(res, {
      [`status is 200 (${req.url})`]: (r) => r.status === 200,
    });
  });

  sleep(1);
}
