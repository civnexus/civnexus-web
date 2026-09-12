import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'civnexus-sites-worker',
      closeBundle() {
        const html = readFileSync('dist/index.html', 'utf8');
        const heroImage = readFileSync('public/hero-earth.png').toString('base64');
        const tidalImage = readFileSync('public/tidal-commons.webp').toString('base64');
        const canopyImage = readFileSync('public/canopy.webp').toString('base64');
        const sunwellImage = readFileSync('public/sunwell.webp').toString('base64');
        const meridianImage = readFileSync('public/meridian.webp').toString('base64');
        const vitruviaImage = readFileSync('public/vitruvia.webp').toString('base64');
        const amberArchiveImage = readFileSync('public/amber-archive.webp').toString('base64');
        const livingTreasuryImage = readFileSync('public/living-treasury.webp').toString('base64');
        const asterAcademyImage = readFileSync('public/aster-academy.webp').toString('base64');
        const mantleWorksImage = readFileSync('public/mantle-works.webp').toString('base64');
        const harmonicImage = readFileSync('public/the-harmonic.webp').toString('base64');
        const edenImage = readFileSync('public/eden.webp').toString('base64');
        const elenaImage = readFileSync('public/elena.webp').toString('base64');
        const laraImage = readFileSync('public/lara.webp').toString('base64');
        const rowanImage = readFileSync('public/rowan.webp').toString('base64');
        const julianImage = readFileSync('public/julian.webp').toString('base64');
        const adrianImage = readFileSync('public/adrian.webp').toString('base64');
        const eliasImage = readFileSync('public/elias.webp').toString('base64');
        const claraImage = readFileSync('public/clara.webp').toString('base64');
        const felixImage = readFileSync('public/felix.webp').toString('base64');
        const calderImage = readFileSync('public/calder.webp').toString('base64');
        const lucianImage = readFileSync('public/lucian.webp').toString('base64');
        const gabrielImage = readFileSync('public/gabriel.webp').toString('base64');
        const faviconImage = readFileSync('public/favicon.svg').toString('base64');
        mkdirSync('dist/server', { recursive: true });
        writeFileSync(
          'dist/server/index.js',
          `const html = ${JSON.stringify(html)};
const heroImage = ${JSON.stringify(heroImage)};
const faviconImage = ${JSON.stringify(faviconImage)};
const tidalImage = ${JSON.stringify(tidalImage)};
const canopyImage = ${JSON.stringify(canopyImage)};
const sunwellImage = ${JSON.stringify(sunwellImage)};
const meridianImage = ${JSON.stringify(meridianImage)};
const vitruviaImage = ${JSON.stringify(vitruviaImage)};
const amberArchiveImage = ${JSON.stringify(amberArchiveImage)};
const newPlaceImages = {
  '/aurora-reach.webp': ${JSON.stringify(readFileSync('public/aurora-reach.webp').toString('base64'))},
  '/mara.webp': ${JSON.stringify(readFileSync('public/mara.webp').toString('base64'))},
  '/living-treasury.webp': ${JSON.stringify(livingTreasuryImage)},
  '/aster-academy.webp': ${JSON.stringify(asterAcademyImage)},
  '/mantle-works.webp': ${JSON.stringify(mantleWorksImage)},
  '/the-harmonic.webp': ${JSON.stringify(harmonicImage)},
  '/eden.webp': ${JSON.stringify(edenImage)},
};
const portraitImages = {
  '/elena.webp': ${JSON.stringify(elenaImage)},
  '/lara.webp': ${JSON.stringify(laraImage)},
  '/rowan.webp': ${JSON.stringify(rowanImage)},
  '/julian.webp': ${JSON.stringify(julianImage)},
  '/adrian.webp': ${JSON.stringify(adrianImage)},
  '/elias.webp': ${JSON.stringify(eliasImage)},
  '/clara.webp': ${JSON.stringify(claraImage)},
  '/felix.webp': ${JSON.stringify(felixImage)},
  '/calder.webp': ${JSON.stringify(calderImage)},
  '/lucian.webp': ${JSON.stringify(lucianImage)},
  '/gabriel.webp': ${JSON.stringify(gabrielImage)},
};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache',
        },
      });
    }

    if (url.pathname === '/hero-earth.png' || url.pathname === '/og.png') {
      return new Response(decodeBase64(heroImage), {
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/favicon.svg') {
      return new Response(decodeBase64(faviconImage), {
        headers: {
          'content-type': 'image/svg+xml; charset=utf-8',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/tidal-commons.webp') {
      return new Response(decodeBase64(tidalImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/canopy.webp') {
      return new Response(decodeBase64(canopyImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/sunwell.webp') {
      return new Response(decodeBase64(sunwellImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/meridian.webp') {
      return new Response(decodeBase64(meridianImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/vitruvia.webp') {
      return new Response(decodeBase64(vitruviaImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (url.pathname === '/amber-archive.webp') {
      return new Response(decodeBase64(amberArchiveImage), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (newPlaceImages[url.pathname]) {
      return new Response(decodeBase64(newPlaceImages[url.pathname]), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (portraitImages[url.pathname]) {
      return new Response(decodeBase64(portraitImages[url.pathname]), {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  }
};\n`,
        );
      },
    },
  ],
});
