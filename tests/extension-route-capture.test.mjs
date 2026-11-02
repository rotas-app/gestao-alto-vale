import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const adminContentSource = await readFile(
  new URL("../extension/admin-content.js", import.meta.url),
  "utf8"
);
const backgroundSource = await readFile(
  new URL("../extension/background.js", import.meta.url),
  "utf8"
);

function captureMessage(payload, url) {
  const listeners = new Map();
  const sentMessages = [];
  const window = {
    location: { href: "https://envios.adminml.com/logistics/monitoring" },
    addEventListener: (type, listener) => listeners.set(type, listener),
    setTimeout: () => 0,
  };
  const document = {
    createElement: () => ({ remove: () => {} }),
    documentElement: { appendChild: () => {} },
  };
  const chrome = {
    runtime: {
      getURL: (path) => path,
      sendMessage: (message) => sentMessages.push(message),
    },
  };

  vm.runInNewContext(adminContentSource, { window, document, chrome });
  listeners.get("message")({
    source: window,
    data: {
      source: "alto-vale-admin-panel",
      type: "ROUTE_IDS_FOUND",
      payload,
      url,
    },
  });

  return sentMessages.filter((message) => message.type === "STORE_ROUTE_IDS");
}

test("captures route IDs from route records, not nested package or driver IDs", () => {
  const messages = captureMessage(
    {
      data: {
        routes: [
          {
            id: "346275567",
            cluster: "ABC",
            driver: { id: "998877665", driverName: "Motorista" },
            transportUnits: [{ id: "887766554", status: "delivered" }],
            stops: [{ id: "776655443" }],
          },
        ],
      },
    },
    "https://envios.adminml.com/logistics/api/monitoring/get-routes-list?siteId=MLB"
  );

  assert.equal(messages.length, 1);
  assert.deepEqual(Array.from(messages[0].routeIds), ["346275567"]);
  assert.equal(messages[0].replace, true);
});

test("keeps explicit routeId fields and ignores generic IDs outside the route list", () => {
  const messages = captureMessage(
    {
      data: {
        shipment: { id: "887766554" },
        route: { routeId: "346275567" },
      },
    },
    "https://envios.adminml.com/logistics/api/monitoring/route-summary"
  );

  assert.equal(messages.length, 1);
  assert.deepEqual(Array.from(messages[0].routeIds), ["346275567"]);
  assert.equal(messages[0].replace, false);
});

test("an empty fresh route list replaces previous captures", () => {
  const messages = captureMessage(
    { data: { routes: [] } },
    "https://envios.adminml.com/logistics/api/monitoring/get-routes-list?siteId=MLB"
  );

  assert.equal(messages.length, 1);
  assert.deepEqual(Array.from(messages[0].routeIds), []);
  assert.equal(messages[0].replace, true);
});

test("captures the route date from route-list records", () => {
  const messages = captureMessage(
    {
      data: {
        routes: [
          {
            id: "346275567",
            routeDate: "2026-11-01T08:30:00-03:00",
            driver: { driverName: "Motorista" },
          },
        ],
      },
    },
    "https://envios.adminml.com/logistics/api/monitoring/get-routes-list?siteId=MLB"
  );

  assert.equal(messages.length, 1);
  assert.deepEqual(Array.from(messages[0].routeIds), ["346275567"]);
  assert.deepEqual(Object.assign({}, messages[0].routeDates), {
    "346275567": "2026-11-01",
  });
});

test("uses the tab with the newest route capture and replaces old IDs", async () => {
  let messageListener;
  let now = 100;
  const queriedTabs = [
    { id: 1, url: "https://envios.adminml.com/old-monitoring" },
    { id: 2, url: "https://envios.adminml.com/current-monitoring" },
  ];
  const scriptTargets = [];
  const chrome = {
    runtime: { onMessage: { addListener: (listener) => (messageListener = listener) } },
    tabs: {
      onRemoved: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
      query: async () => queriedTabs,
    },
    scripting: {
      executeScript: async ({ target }) => {
        scriptTargets.push(target.tabId);
        return scriptTargets.length === 1
          ? [{ result: [] }]
          : [{ result: { routes: [] } }];
      },
    },
  };
  class TestDate extends Date {
    static now() {
      now += 1;
      return now;
    }
  }
  vm.runInNewContext(backgroundSource, { chrome, Date: TestDate });

  const send = (message, sender = {}) =>
    new Promise((resolve) => messageListener(message, sender, resolve));

  await send(
    { type: "STORE_ROUTE_IDS", routeIds: ["111111111"], replace: true },
    { tab: { id: 1 } }
  );
  await send(
    { type: "STORE_ROUTE_IDS", routeIds: ["222222222"], replace: true },
    { tab: { id: 2 } }
  );
  await send(
    { type: "STORE_ROUTE_IDS", routeIds: ["333333333"], replace: true },
    { tab: { id: 2 } }
  );

  const response = await send({ type: "SYNC_VISIBLE_ROUTES" });

  assert.equal(response.ok, true);
  assert.deepEqual(Array.from(scriptTargets), [2, 2]);
});

test("counts failed visits as pending, not final delivery failures", async () => {
  let messageListener;
  const units = Array.from({ length: 20 }, () => ({
    status: "shipped",
    substatus: "receiver_absent",
  }));
  units.push({ status: "not_delivered", substatus: "returned" });

  const chrome = {
    runtime: { onMessage: { addListener: (listener) => (messageListener = listener) } },
    tabs: {
      onRemoved: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
      query: async () => [{ id: 7, url: "https://envios.adminml.com/monitoring" }],
    },
    scripting: {
      executeScript: async ({ func, args }) => [
        { result: await func(...args) },
      ],
    },
  };
  const fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: "466072461", date: "2026-11-01", transportUnits: units }),
  });
  const immediateTimeout = (callback) => {
    callback();
    return 0;
  };
  vm.runInNewContext(backgroundSource, {
    chrome,
    fetch,
    setTimeout: immediateTimeout,
  });

  const response = await new Promise((resolve) =>
    messageListener(
      { type: "SYNC_ROUTES", routeIds: ["466072461"] },
      {},
      resolve
    )
  );

  assert.equal(response.ok, true);
  assert.equal(response.routes[0].failed, 1);
  assert.equal(response.routes[0].pending, 20);
  assert.equal(response.routes[0].total, 21);
  assert.equal(response.routes[0].directTransportUnits, 21);
  assert.equal(response.routes[0].statusBreakdown["receiver_absent + shipped"], 20);
  assert.equal(response.routes[0].statusBreakdown["not_delivered + returned"], 1);
  assert.equal(response.routes[0].transportUnitArrays[0].path, "$.transportUnits");
  assert.equal(response.routes[0].data, "2026-11-01");
  assert.equal(
    response.routes[0].transportUnitArrays[0].fieldBreakdown["unit.substatus"].receiver_absent,
    20
  );
});

test("uses the route-list date when route detail does not include one", async () => {
  let messageListener;
  const chrome = {
    runtime: { onMessage: { addListener: (listener) => (messageListener = listener) } },
    tabs: {
      onRemoved: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
      query: async () => [{ id: 9, url: "https://envios.adminml.com/monitoring" }],
    },
    scripting: {
      executeScript: async ({ func, args }) => [
        { result: await func(...args) },
      ],
    },
  };
  const fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      id: "346275567",
      transportUnits: [{ id: "package-1", status: "delivered" }],
    }),
  });
  vm.runInNewContext(backgroundSource, {
    chrome,
    fetch,
    setTimeout: (callback) => {
      callback();
      return 0;
    },
  });

  const send = (message, sender = {}) =>
    new Promise((resolve) => messageListener(message, sender, resolve));

  await send(
    {
      type: "STORE_ROUTE_IDS",
      routeIds: ["346275567"],
      routeDates: { "346275567": "2026-11-01" },
      replace: true,
    },
    { tab: { id: 9 } }
  );
  const response = await send(
    { type: "SYNC_ROUTES", routeIds: ["346275567"] },
    {}
  );

  assert.equal(response.ok, true);
  assert.equal(response.routes[0].data, "2026-11-01");
});

test("excludes transferred pending units from delivery failures and groups nested arrays", async () => {
  let messageListener;
  const units = [
    ...Array.from({ length: 28 }, (_, index) => ({
      id: index === 0
        ? "delivered-0"
        : `transferred-${Math.min(index, 26)}`,
      status: "pending",
      relatedEntity: {
        status: "on_route",
        frontStatus: "not_delivered",
        substatus: "transferred",
      },
    })),
    ...Array.from({ length: 25 }, (_, index) => ({
      id: `delivered-${index}`,
      status: "delivered",
      relatedEntity: {
        status: "on_route",
        frontStatus: "delivered",
        substatus: "delivered",
      },
    })),
  ];
  const data = {
    stops: units.map((unit) => ({ orders: [{ transportUnits: [unit] }] })),
  };
  const chrome = {
    runtime: { onMessage: { addListener: (listener) => (messageListener = listener) } },
    tabs: {
      onRemoved: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
      query: async () => [{ id: 8, url: "https://envios.adminml.com/monitoring" }],
    },
    scripting: {
      executeScript: async ({ func, args }) => [
        { result: await func(...args) },
      ],
    },
  };
  const fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: "466072461", ...data }),
  });
  vm.runInNewContext(backgroundSource, {
    chrome,
    fetch,
    setTimeout: (callback) => {
      callback();
      return 0;
    },
  });

  const response = await new Promise((resolve) =>
    messageListener(
      { type: "SYNC_ROUTES", routeIds: ["466072461"] },
      {},
      resolve
    )
  );

  assert.equal(response.routes[0].total, 51);
  assert.equal(response.routes[0].delivered, 25);
  assert.equal(response.routes[0].failed, 0);
  assert.equal(response.routes[0].pending, 0);
  assert.equal(response.routes[0].uniqueTransportUnitIdCount, 51);
  assert.equal(response.routes[0].transportUnitArrays.length, 1);
  assert.equal(
    response.routes[0].transportUnitArrays[0].path,
    "$.stops[*].orders[*].transportUnits"
  );
  assert.equal(response.routes[0].transportUnitArrays[0].count, 53);
});
