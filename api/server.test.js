const request = require('supertest');
const app = require('./server');

describe('GET /products', () => {
  it('should return a list of products', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(res.body[0]).toHaveProperty('name');
  });
});
