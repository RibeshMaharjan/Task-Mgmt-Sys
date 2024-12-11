import supertest from 'supertest';
import app from '../app.js';

describe("GET /index", () => {
  // return index to the user
  test("should respond with 200 status code", async () => {
    const response = await fetch('http://localhost:8000');
    
    expect(response.status).toBe(200);
  })
  
  // page doesnot exist
  test("should respond with 404 status code", async () => {
    const response = await fetch('http://localhost:8000/homes');
    
    expect(response.status).toBe(500);
  })
})