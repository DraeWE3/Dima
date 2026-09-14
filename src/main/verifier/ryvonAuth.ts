import type { Page } from 'playwright';

/**
 * Shared Ryvon authentication for every verifier.
 *
 * Previously each verifier hardcoded its own copy of the login selectors.
 * When Ryvon's login page changed, MasterEcosystemVerifier was updated and
 * the other four were not, so they sat waiting on a placeholder
 * ("Enter email or phone") that no longer existed and timed out after 10s.
 * Because every UI verifier authenticates first, that single stale string
 * disabled all of them.
 *
 * The selectors here are ordered semantic-first: input type and name survive
 * copy changes, placeholders do not. Placeholder matches are kept last as a
 * fallback so this still works if the markup regresses.
 */

export type RyvonCredentials = { email: string; password: string };

/** Test account. Env vars win so credentials need not live in source. */
export function getCredentials(): RyvonCredentials {
  return {
    email: process.env.RYVON_TEST_EMAIL || 'samloko9055@gmail.com',
    password: process.env.RYVON_TEST_PASSWORD || 'Emma@7aa',
  };
}

async function firstVisible(page: Page, selectors: string[], timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    for (const selector of selectors) {
      try {
        const locator = page.locator(selector).first();
        if (await locator.isVisible({ timeout: 500 })) return locator;
      } catch (err) {
        lastError = err;
      }
    }
    await page.waitForTimeout(250);
  }
  throw new Error(
    `None of these selectors became visible within ${timeoutMs}ms:\n  ${selectors.join('\n  ')}` +
      (lastError ? `\nLast error: ${(lastError as Error).message}` : '')
  );
}

/**
 * Logs in and returns the workspace slug the app lands on.
 *
 * Every product surface lives under /[workspaceSlug]/..., so callers must not
 * hardcode paths like /workflows - that route does not exist at the root and
 * will 404 or bounce. Navigating to "/" lets the app's own middleware resolve
 * the right workspace, and the slug is read back from the resulting URL.
 */
export async function loginToRyvon(
  page: Page,
  appUrl: string,
  trace: (line: string) => void = () => {}
): Promise<{ workspaceSlug: string | null }> {
  const base = appUrl.replace(/\/$/, '');
  const { email, password } = getCredentials();

  trace(`Navigating to ${base}/login to authenticate`);
  await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 120000 });

  trace('Bypassing Coming Soon Overlay via localStorage...');
  await page.evaluate(() => {
    localStorage.setItem('ryvon_unlocked', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });

  trace('Waiting for Login form...');
  const emailInput = await firstVisible(page, [
    'input[type="email"]',
    'input[name="email"]',
    'input#email',
    'input[placeholder="name@company.com"]',
    'input[placeholder*="email" i]',
  ]);
  await emailInput.fill(email);

  const passwordInput = await firstVisible(page, [
    'input[type="password"]',
    'input[name="password"]',
    'input#password',
    'input[placeholder*="password" i]',
  ]);
  await passwordInput.fill(password);

  trace('Submitting credentials...');
  const submit = await firstVisible(page, [
    'button[type="submit"]',
    'button:has-text("Sign In")',
    'button:has-text("Log In")',
    'button:has-text("Login")',
  ]);
  await submit.click();

  await page
    .waitForURL((url) => !url.pathname.startsWith('/login'), {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    .catch(() => {
      trace('[WARNING] Still on /login after submit - credentials may be wrong.');
    });

  // Land on "/" so middleware resolves the active workspace for us.
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });

  const workspaceSlug = await page.evaluate(() => {
    const first = window.location.pathname.split('/').filter(Boolean)[0];
    const reserved = ['login', 'register', 'welcome', 'new', 'resolve', 'join', 'api', 'product'];
    return first && !reserved.includes(first) ? first : null;
  });

  trace(
    workspaceSlug
      ? `Authenticated. Active workspace: ${workspaceSlug}`
      : '[WARNING] Authenticated but no workspace slug resolved.'
  );

  return { workspaceSlug };
}

/** Builds a workspace-scoped URL, e.g. wsPath(base, slug, "/workflows"). */
export function wsPath(appUrl: string, slug: string | null, path: string): string {
  const base = appUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return slug ? `${base}/${slug}${p}` : `${base}${p}`;
}
