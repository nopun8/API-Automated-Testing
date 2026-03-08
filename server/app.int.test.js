import request from "supertest";
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import jwt from "jsonwebtoken";
import * as repository from "./repository/todoRepository.js";

const generateToken = (email = "student@example.com") =>
  jwt.sign({ email }, process.env.JWT_SECRET ?? "express-jest-supertest-secret");

beforeEach(() => {
  repository.reset();
});

test("1) GET / returns a list (200 + array)", async () => {
  const response = await request(app).get("/");

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});

test("2) POST /create without a token → 401", async () => {
  const response = await request(app)
    .post("/create")
    .send({ task: { description: "X" } });

  expect(response.status).toBe(401);
});

test("3) POST /create with a token → 201 + id", async () => {
  const authToken = generateToken();

  const response = await request(app)
    .post("/create")
    .set("Authorization", authToken)
    .send({ task: { description: "Test task" } });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("id");
});

test("4) POST /create with missing data → 400", async () => {
  const authToken = generateToken();

  const response = await request(app)
    .post("/create")
    .set("Authorization", authToken)
    .send({ task: null });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("error");
});

test("5) Created task appears in GET /", async () => {
  const authToken = generateToken();

  await request(app)
    .post("/create")
    .set("Authorization", authToken)
    .send({ task: { description: "Buy milk" } });

  const response = await request(app).get("/");

  expect(response.body).toHaveLength(1);
  expect(response.body[0].description).toBe("Buy milk");
});

test("6) POST /create with invalid token → 401", async () => {
  const response = await request(app)
    .post("/create")
    .set("Authorization", "invalid-token")
    .send({ task: { description: "Some task" } });

  expect(response.status).toBe(401);
});

test("7) DELETE removes task", async () => {
  const authToken = generateToken();

  await request(app)
    .post("/create")
    .set("Authorization", authToken)
    .send({ task: { description: "Task to delete" } });

  const deleteResponse = await request(app)
    .delete("/1")
    .set("Authorization", authToken);

  expect(deleteResponse.status).toBe(204);

  const listResponse = await request(app).get("/");
  expect(listResponse.body).toHaveLength(0);
});

test("8) DELETE unknown id → 404", async () => {
  const authToken = generateToken();

  const response = await request(app)
    .delete("/999")
    .set("Authorization", authToken);

  expect(response.status).toBe(404);
});

test("9) POST /create with too short description → 400", async () => {
  const authToken = generateToken();

  const response = await request(app)
    .post("/create")
    .set("Authorization", authToken)
    .send({ task: { description: "A" } });

  expect(response.status).toBe(400);
});

test("Bonus) GET / when no tasks exist → returns empty array", async () => {
  const response = await request(app).get("/");

  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});