"""
E2E smoke test for the full auth flow.
Tests against live Keycloak at localhost:8180 and Angular app at localhost:4200.

Usage:
  .venv/bin/python3 -u e2e/test_login_flow.py
"""
import asyncio
import json
import base64
import sys
import os
from patchright.async_api import async_playwright

KC_URL = "http://localhost:8180"
APP_URL = "http://localhost:4200"
REALM = "platform"
USERNAME = os.environ.get("TEST_USERNAME", "gbrabelo")
PASSWORD = os.environ.get("TEST_PASSWORD", "teste@Teste123")

results = []


def decode_jwt(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        return {}
    payload = parts[1] + "=" * (4 - len(parts[1]) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def check(name: str, passed: bool, detail: str = ""):
    results.append((name, passed, detail))
    s = "PASS" if passed else "FAIL"
    print(f"  [{s}] {name}" + (f" — {detail}" if detail else ""))


async def do_login(page, label="login"):
    """Fill username, password, OTP. Assumes page is on Keycloak login."""
    try:
        await page.wait_for_selector('input[name="username"]', timeout=10000)
    except Exception:
        body = (await page.text_content("body") or "")[:150]
        print(f"  [DEBUG] No username field at {page.url}: {body}")
        return False

    await page.locator('input[name="username"]').fill(USERNAME)
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.locator('input[type="submit"], button[type="submit"]').click()
    await page.wait_for_load_state("networkidle", timeout=10000)

    if "login-actions" in page.url:
        sys.stderr.write(f"\n  >>> Enter OTP code ({label}): ")
        sys.stderr.flush()
        otp = sys.stdin.readline().strip()
        try:
            await page.wait_for_selector(
                'input[name="otp"], input[id="otp"]', timeout=5000)
        except Exception:
            body = (await page.text_content("body") or "")[:150]
            print(f"  [DEBUG] No OTP field at {page.url}: {body}")
            return False
        await page.locator('input[name="otp"], input[id="otp"]').fill(otp)
        await page.locator(
            'input[type="submit"], button[type="submit"]').click()
        try:
            await page.wait_for_url(f"{APP_URL}/**", timeout=15000)
        except Exception:
            pass

    await page.wait_for_load_state("networkidle", timeout=10000)
    return APP_URL in page.url


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        token_response = {}

        async def on_response(response):
            if ("/protocol/openid-connect/token" in response.url
                    and response.status == 200):
                try:
                    token_response["data"] = await response.json()
                except Exception:
                    pass

        page.on("response", on_response)

        console_errors = []
        page.on("console",
                lambda m: console_errors.append(m.text)
                if m.type == "error" else None)

        # ══════════════════════════════════════════════════════════
        print("\n=== 1. Login Flow ===\n")

        await page.goto(APP_URL, wait_until="networkidle", timeout=15000)

        check("Redirects to Keycloak", KC_URL in page.url)
        check("PKCE in auth URL",
              "code_challenge=" in page.url and "S256" in page.url)
        check("State in auth URL", "state=" in page.url)
        check("Nonce in auth URL", "nonce=" in page.url)

        await page.locator('input[name="username"]').fill(USERNAME)
        await page.locator('input[name="password"]').fill(PASSWORD)
        await page.locator(
            'input[type="submit"], button[type="submit"]').click()
        await page.wait_for_load_state("networkidle", timeout=10000)

        check("OTP page shown after password", "login-actions" in page.url)

        sys.stderr.write("\n  >>> Enter OTP code (initial login): ")
        sys.stderr.flush()
        otp = sys.stdin.readline().strip()
        await page.locator('input[name="otp"], input[id="otp"]').fill(otp)
        await page.locator(
            'input[type="submit"], button[type="submit"]').click()
        try:
            await page.wait_for_url(f"{APP_URL}/**", timeout=15000)
        except Exception:
            pass
        await page.wait_for_load_state("networkidle", timeout=10000)

        check("Landed on app", APP_URL in page.url, f"URL: {page.url}")

        body = await page.text_content("body") or ""
        check("Welcome rendered", "Welcome" in body and "auth.welcome" not in body)
        check("Username in greeting", USERNAME in body)
        check("Logout button translated", "Logout" in body or "Sair" in body)
        check("No console errors", len(console_errors) == 0,
              f"{console_errors}" if console_errors else "")

        # ══════════════════════════════════════════════════════════
        print("\n=== 2. Token Claims ===\n")

        td = token_response.get("data", {})
        check("Has access_token", bool(td.get("access_token")))
        check("Has id_token", bool(td.get("id_token")))
        check("Has refresh_token", bool(td.get("refresh_token")))

        at = decode_jwt(td.get("access_token", ""))
        idt = decode_jwt(td.get("id_token", ""))
        print(f"\n  Access token: {json.dumps(at, indent=2)}\n")

        check("AT acr=mfa",
              at.get("acr") == "urn:platform:acr:mfa", f"acr={at.get('acr')}")
        check("AT preferred_username",
              at.get("preferred_username") == USERNAME)
        check("AT issuer", at.get("iss") == f"{KC_URL}/realms/{REALM}")
        check("AT audience", at.get("aud") == "platform-frontend")
        check("AT scope has openid", "openid" in at.get("scope", ""))
        check("IDT preferred_username",
              idt.get("preferred_username") == USERNAME)
        check("IDT acr", "acr" in idt, f"acr={idt.get('acr')}")
        check("IDT nonce", "nonce" in idt)

        # ══════════════════════════════════════════════════════════
        print("\n=== 3. Security ===\n")

        pkce = await page.evaluate("""() => ({
            v: sessionStorage.getItem('pkce_code_verifier'),
            s: sessionStorage.getItem('pkce_state'),
            n: sessionStorage.getItem('pkce_nonce'),
        })""")
        check("PKCE verifier cleared", pkce["v"] is None)
        check("PKCE state cleared", pkce["s"] is None)
        check("PKCE nonce cleared", pkce["n"] is None)

        # ══════════════════════════════════════════════════════════
        print("\n=== 4. Logout Flow ===\n")

        # We're on the welcome page from the login test — click logout
        logout_btn = page.locator("button", has_text="Logout").or_(
            page.locator("button", has_text="Sair"))

        async with page.expect_navigation(timeout=15000):
            await logout_btn.click()

        await page.wait_for_load_state("networkidle", timeout=15000)
        await page.wait_for_timeout(2000)

        post_body = (await page.text_content("body") or "")[:200]
        check("Logout redirected away from welcome", "Welcome" not in post_body)

        # Fresh navigation should require login
        await page.goto(APP_URL, wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(1000)
        check("After logout, requires login", KC_URL in page.url)

        # ══════════════════════════════════════════════════════════
        print("\n=== 5. Re-login After Logout ===\n")

        token_response.clear()
        logged_in = await do_login(page, "re-login")
        check("Re-login successful", logged_in, f"URL: {page.url}")

        if logged_in:
            body = await page.text_content("body") or ""
            check("Welcome after re-login", "Welcome" in body)
            td2 = token_response.get("data", {})
            if td2:
                at2 = decode_jwt(td2.get("access_token", ""))
                check("Re-login acr=mfa",
                      at2.get("acr") == "urn:platform:acr:mfa",
                      f"acr={at2.get('acr')}")

        # ══════════════════════════════════════════════════════════
        print("\n=== 6. i18n Pages ===\n")

        await page.goto(f"{APP_URL}/auth/error",
                        wait_until="networkidle", timeout=10000)
        t = await page.text_content("body") or ""
        check("/auth/error translated",
              "Authentication Service Unavailable" in t or "Serviço" in t)
        check("/auth/error no raw keys", "auth.error.title" not in t)

        await page.goto(f"{APP_URL}/auth/session-expired",
                        wait_until="networkidle", timeout=10000)
        t = await page.text_content("body") or ""
        check("/auth/session-expired translated",
              "Session Expired" in t or "Sessão" in t)

        # ══════════════════════════════════════════════════════════
        print("\n=== 7. Session Expired → Log In ===\n")

        btn = page.locator("button", has_text="Log In").or_(
            page.locator("button", has_text="Entrar"))
        check("Log In button present", await btn.count() > 0)
        if await btn.count() > 0:
            await btn.click()
            await page.wait_for_load_state("networkidle", timeout=10000)
            check("Log In triggers auth flow",
                  KC_URL in page.url or APP_URL in page.url)

        # ══════════════════════════════════════════════════════════
        print("\n=== 8. Auth Error → Retry ===\n")

        await page.goto(f"{APP_URL}/auth/error",
                        wait_until="networkidle", timeout=10000)
        btn = page.locator("button", has_text="Retry").or_(
            page.locator("button", has_text="Tentar"))
        check("Retry button present", await btn.count() > 0)
        if await btn.count() > 0:
            await btn.click()
            await page.wait_for_load_state("networkidle", timeout=10000)
            check("Retry navigates away", "/auth/error" not in page.url)

        await browser.close()

        # ══════════════════════════════════════════════════════════
        print("\n" + "=" * 50)
        passed = sum(1 for _, p, _ in results if p)
        failed = sum(1 for _, p, _ in results if not p)
        print(f"Results: {passed} passed, {failed} failed, {len(results)} total")
        if failed:
            print("\nFailed:")
            for n, p, d in results:
                if not p:
                    print(f"  ✗ {n}" + (f" — {d}" if d else ""))
        print("=" * 50)
        sys.exit(1 if failed else 0)


asyncio.run(main())
