const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const checks = [
    { name: "health", path: "/health", status: 200 },
    { name: "unknown route", path: "/api/nothing-here", status: 404 },
    { name: "public profile hits MongoDB and Redis", path: "/api/user/u/nobody_here", status: 404 },
    { name: "protected route needs a token", path: "/api/user/me", status: 401 },
    {
        name: "validation runs",
        path: "/api/auth/login",
        method: "POST",
        body: { email: "not-an-email", password: "x" },
        status: 400,
    },
];

let failed = 0;

for (const check of checks) {
    const res = await fetch(baseUrl + check.path, {
        method: check.method ?? "GET",
        headers: check.body ? { "content-type": "application/json" } : {},
        body: check.body ? JSON.stringify(check.body) : undefined,
    });
    const ok = res.status === check.status;
    if (!ok) failed += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${check.name}: expected ${check.status}, got ${res.status}`);
}

if (failed > 0) {
    console.error(`${failed} smoke check(s) failed`);
    process.exit(1);
}

console.log("All smoke checks passed");
