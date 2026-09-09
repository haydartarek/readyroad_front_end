/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { NextRequest } from "next/server";
import proxy from "@/proxy";

it("serves the service worker without a locale or login redirect", async () => {
  const response = await proxy(new NextRequest("http://localhost:3000/learning-notifications-sw.js", {
    headers: { cookie: "language=ar" },
  }));
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-next")).toBe("1");
});
it("shows a same-origin notification but rejects external destinations", async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const show = jest.fn().mockResolvedValue(undefined);
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), "public/learning-notifications-sw.js"), "utf8"), {
    URL, self: { location: { origin: "https://rijvia.be" }, registration: { showNotification: show },
      addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
  });
  const send = (url: string) => handlers.push({ data: { json: () => ({ body: "A study reminder", url, tag: "learning-1" }) },
    waitUntil: jest.fn() });
  send("https://attacker.test/path");
  expect(show).not.toHaveBeenCalled();
  send("https://rijvia.be/ar/practice");
  expect(show).toHaveBeenCalledWith("RijVia", expect.objectContaining({ tag: "learning-1",
    data: { url: "https://rijvia.be/ar/practice" } }));
});
