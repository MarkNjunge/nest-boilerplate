import http from "k6/http";
import { check, sleep } from "k6";
import { faker } from "@faker-js/faker/locale/en";

export const options = {
  stages: [
    // ------
    // Validation
    // { duration: "10s", target: 1 },
    // ------
    { duration: "5s", target: 50 },
    { duration: "15s", target: 100 },
    { duration: "5s", target: 50 },
    // ------
    // { duration: "30s", target: 100 },
    // { duration: "1m", target: 100 },
    // { duration: "30s", target: 50 },
    // ------
    // Spike
    // { duration: "1m", target: 2000 }, // fast ramp-up to a high point
    // { duration: "30", target: 0 }, // quick ramp-down to 0 users
  ],
  thresholds: {
    http_req_failed: [{ threshold: "rate < 0.01", abortOnFail: true }],
  },
};

export default function (): void {
  const host = __ENV.API_HOST || "http://localhost:3000";
  const apiKey = __ENV.API_KEY || "api-key";

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  };

  function get(endpoint: string, tags?: Record<string, string>) {
    return http.get(`${host}${endpoint}`, { ...params, tags });
  }

  function post(endpoint: string, data: Record<string, any>, tags?: Record<string, string>) {
    return http.post(`${host}${endpoint}`, JSON.stringify(data), { ...params, tags });
  }

  function put(endpoint: string, data: Record<string, any>, tags?: Record<string, string>) {
    return http.put(`${host}${endpoint}`, JSON.stringify(data), { ...params, tags });
  }

  function del(endpoint: string, data: Record<string, any>, tags?: Record<string, string>) {
    return http.del(`${host}${endpoint}`, JSON.stringify(data), { ...params, tags });
  }

  const username: string = faker.internet.displayName();

  // Create a user
  const createUserRes = post("/users", {
    username,
    contact: {
      email: `${username}@mail.com`
    }
  }, { name: "create-user" });
  check(createUserRes, {
    "create user status is 201": r => r.status === 201,
  });
  sleep(1);

  const userId: string = (createUserRes.json()! as any).id;

  // Search for user
  const searchRes = get(`/users?filter=(username,=,${username})`, { name: "search" });
  check(searchRes, {
    "search status is 200": r => r.status === 200,
    "search returns the user": r => r.json()![0].username === username,
  });
  sleep(1);

  // Create an address
  const createAddressRes = post(`/users/${userId}/addresses`, {
    city: faker.location.city(),
    country: faker.location.country()
  }, { name: "create-address" });
  check(createAddressRes, {
    "create address status is 201": r => r.status === 201,
  });
  sleep(1);

  // Update a user
  const updateUserRes = put(`/users/${userId}`, {
    username: `${username}_2025`,
    contact: {
      email: `${username}@mail.com`
    }
  }, { name: "update-user" });
  check(updateUserRes, {
    "update user status is 200": r => r.status === 200,
  });
  sleep(1);

  // Delete a user
  const deleteUserRes = del(`/users/${userId}`, {}, { name: "delete-user" });
  check(deleteUserRes, {
    "delete user status is 200": r => r.status === 200,
  });
}