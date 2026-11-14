import assert from 'node:assert/strict';
import test from 'node:test';

import robots from '../src/app/robots';
import { storeFaqs } from '../src/lib/faqs';
import { DEFAULT_SITE_URL, getSiteBaseUrl } from '../src/lib/http';
import { storeConfig } from '../src/lib/store-config';

test('getSiteBaseUrl returns PUBLIC_APP_URL when configured', () => {
  const previous = process.env.PUBLIC_APP_URL;
  process.env.PUBLIC_APP_URL = 'https://custom-domain.com';
  assert.equal(getSiteBaseUrl(), 'https://custom-domain.com');
  if (previous === undefined) delete process.env.PUBLIC_APP_URL;
  else process.env.PUBLIC_APP_URL = previous;
});

test('getSiteBaseUrl falls back to DEFAULT_SITE_URL in production', () => {
  const env = process.env as Record<string, string | undefined>;
  const prevUrl = env.PUBLIC_APP_URL;
  const prevNextUrl = env.NEXT_PUBLIC_APP_URL;
  const prevSiteUrl = env.NEXT_PUBLIC_SITE_URL;
  const prevNodeEnv = env.NODE_ENV;
  delete env.PUBLIC_APP_URL;
  delete env.NEXT_PUBLIC_APP_URL;
  delete env.NEXT_PUBLIC_SITE_URL;
  env.NODE_ENV = 'production';

  assert.equal(getSiteBaseUrl(), DEFAULT_SITE_URL);

  // Even if PUBLIC_APP_URL is accidentally set to localhost in production:
  env.PUBLIC_APP_URL = 'http://localhost:3000';
  assert.equal(getSiteBaseUrl(), DEFAULT_SITE_URL);

  if (prevUrl !== undefined) env.PUBLIC_APP_URL = prevUrl;
  else delete env.PUBLIC_APP_URL;
  if (prevNextUrl !== undefined) env.NEXT_PUBLIC_APP_URL = prevNextUrl;
  if (prevSiteUrl !== undefined) env.NEXT_PUBLIC_SITE_URL = prevSiteUrl;
  env.NODE_ENV = prevNodeEnv;
});

test('robots excludes private paths and points to sitemap', () => {
  const config = robots();
  assert.ok(config.sitemap, 'robots must define sitemap');
  assert.ok(String(config.sitemap).endsWith('/sitemap.xml'));

  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const userAgentAll = rules.find((r) => r?.userAgent === '*');
  assert.ok(userAgentAll, 'Must have a rule for userAgent *');
  const disallow = Array.isArray(userAgentAll.disallow)
    ? userAgentAll.disallow
    : [userAgentAll.disallow];

  assert.ok(disallow.includes('/admin'));
  assert.ok(disallow.includes('/api/'));
  assert.ok(disallow.includes('/account'));
  assert.ok(disallow.includes('/cart'));
  assert.ok(disallow.includes('/checkout'));
  assert.ok(disallow.includes('/wishlist'));
  assert.ok(disallow.includes('/track'));
});

test('store FAQs are structured for FAQPage schema', () => {
  assert.ok(storeFaqs.length >= 5);
  for (const faq of storeFaqs) {
    assert.ok(faq.question.trim().length > 5);
    assert.ok(faq.answer.trim().length > 10);
  }
});

test('storeConfig contains required SEO branding elements', () => {
  assert.ok(storeConfig.name.length > 0);
  assert.ok(storeConfig.tagline.length > 0);
  assert.ok(storeConfig.description.length > 20);
  assert.ok(storeConfig.siteUrl.startsWith('https://'));
  assert.ok(storeConfig.socials.length > 0);
});
