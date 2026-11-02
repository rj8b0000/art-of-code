#!/usr/bin/env node
// Builds collection-v21-skeleton.json from the reference scripts so they never drift.
// Usage: node build-skeleton.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const lines = (f) => readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n").trimEnd().split("\n");
const script = (f) => ({ type: "text/javascript", exec: lines(f) });
const jsonHeaders = [
  { key: "Content-Type", value: "application/json" },
  { key: "Accept", value: "application/json" },
];

const collection = {
  info: {
    name: "<API name>",
    description:
      "Setup: import this collection and one environment, select it, set `userName` and `password` (secret) on the environment, then send any request. Auth is Bearer {{accessToken}} inherited by every request; a collection pre-request script logs in automatically when the token is missing or about to expire.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }] },
  event: [
    { listen: "prerequest", script: script("collection-prerequest.js") },
    { listen: "test", script: script("collection-test.js") },
  ],
  variable: [],
  item: [
    {
      name: "00 · Authentication",
      item: [
        {
          name: "Login  →  captures {{accessToken}}",
          event: [{ listen: "test", script: script("login-test.js") }],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: jsonHeaders,
            body: {
              mode: "raw",
              raw: '{\n  "userName": "{{userName}}",\n  "password": "{{password}}"\n}',
              options: { raw: { language: "json" } },
            },
            url: { raw: "{{baseUrl}}/api/Auth/login", host: ["{{baseUrl}}"], path: ["api", "Auth", "login"] },
            description: "Obtains a bearer token. Normally never run by hand: the collection pre-request script calls it automatically.",
          },
          response: [],
        },
        {
          name: "Clear stored token (force re-login)",
          event: [
            {
              listen: "prerequest",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.environment.unset('accessToken');",
                  "pm.environment.unset('tokenExpiresAt');",
                  "pm.environment.unset('refreshToken');",
                  "console.log('[auth] stored token cleared; the next request will log in again.');",
                ],
              },
            },
          ],
          request: {
            method: "GET",
            header: [],
            url: { raw: "{{baseUrl}}/", host: ["{{baseUrl}}"], path: [""] },
            description: "Utility. Clears the stored token so the next request re-authenticates. Use after switching environments or credentials.",
          },
          response: [],
        },
      ],
    },
    { name: "01 · <Resource>", item: [] },
    { name: "99 · Utilities", item: [] },
  ],
};

writeFileSync(path.join(dir, "collection-v21-skeleton.json"), JSON.stringify(collection, null, 2) + "\n");
console.log("wrote collection-v21-skeleton.json");
