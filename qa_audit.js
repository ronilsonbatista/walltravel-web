import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================================================");
console.log("                    WALLTRAVEL — AUTOMATED QA AUDIT                       ");
console.log("==========================================================================\n");

let errors = 0;
let warnings = 0;

// Helper loggers
const pass = (msg) => console.log(`\x1b[32m✓ PASS:\x1b[0m ${msg}`);
const fail = (msg) => {
  console.log(`\x1b[31m✗ FAIL:\x1b[0m ${msg}`);
  errors++;
};
const warn = (msg) => {
  console.log(`\x1b[33m! WARN:\x1b[0m ${msg}`);
  warnings++;
};

// 1. Check vercel.json rewrites
try {
  const vercelJsonPath = path.join(__dirname, 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    const data = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    if (data.rewrites && data.rewrites.length > 0) {
      pass("vercel.json exists and has fallback rewrite rules configured.");
    } else {
      warn("vercel.json exists but is missing rewrite rules.");
    }
  } else {
    fail("vercel.json file is missing in root!");
  }
} catch (e) {
  fail(`Error parsing vercel.json: ${e.message}`);
}

// 2. Audit vitrine.json Local Database
let db = null;
try {
  const jsonPath = path.join(__dirname, 'data', 'vitrine.json');
  if (fs.existsSync(jsonPath)) {
    db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    pass("data/vitrine.json loaded successfully.");
    
    // Check Category properties
    db.categories.forEach(cat => {
      if (!cat.id || !cat.slug || !cat.name || !cat.title || !cat.description || !cat.image) {
        fail(`Category '${cat.id || 'unknown'}' is missing required fields!`);
      } else {
        pass(`Category slug '/vitrine/${cat.slug}' configured correctly.`);
      }
    });

    // Check Package properties
    db.packages.forEach(pkg => {
      if (!pkg.id || !pkg.slug || !pkg.categorySlug || !pkg.name || !pkg.destination || !pkg.duration || !pkg.image) {
        fail(`Package '${pkg.id || 'unknown'}' is missing required fields!`);
      } else {
        pass(`Package slug '/pacote/${pkg.slug}' configured correctly.`);
      }
      
      // Verify Category Slug reference exists
      const catExists = db.categories.some(cat => cat.slug === pkg.categorySlug);
      if (!catExists) {
        fail(`Package '${pkg.name}' points to non-existent categorySlug '${pkg.categorySlug}'!`);
      }
    });
  } else {
    fail("data/vitrine.json is missing!");
  }
} catch (e) {
  fail(`Error reading vitrine.json: ${e.message}`);
}

// 3. Audit Images existence
if (db) {
  console.log("\nAuditing image paths referenced in data/vitrine.json...");
  
  const checkImage = (imgPath) => {
    if (!imgPath.startsWith('/')) {
      fail(`Image path '${imgPath}' must be absolute (start with a '/').`);
      return;
    }
    // Remove leading slash and resolve relative to public folder
    const targetPath = path.join(__dirname, 'public', imgPath.substring(1));
    const rootTargetPath = path.join(__dirname, imgPath.substring(1));
    if (fs.existsSync(targetPath) || fs.existsSync(rootTargetPath)) {
      pass(`Image '${imgPath}' exists locally.`);
    } else {
      fail(`Image '${imgPath}' does not exist on disk!`);
    }
  };

  // Hero slides
  db.heroSlides.forEach(slide => {
    checkImage(slide.image);
  });

  // Honeymoon
  if (db.homeSections?.honeymoon?.image) {
    checkImage(db.homeSections.honeymoon.image);
  }

  // Categories
  db.categories.forEach(cat => {
    checkImage(cat.image);
  });

  // Packages
  db.packages.forEach(pkg => {
    checkImage(pkg.image);
    if (pkg.gallery) {
      pkg.gallery.forEach(img => checkImage(img));
    }
  });
}

// 4. Audit index.html links and resource paths
console.log("\nAuditing index.html links and asset paths...");
try {
  const htmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Find all links (href)
    const hrefReg = /href="([^"]+)"/g;
    let match;
    const links = [];
    while ((match = hrefReg.exec(html)) !== null) {
      links.push(match[1]);
    }
    
    // Find all images (src)
    const srcReg = /src="([^"]+)"/g;
    const srcs = [];
    while ((match = srcReg.exec(html)) !== null) {
      srcs.push(match[1]);
    }

    // Check link paths
    links.forEach(link => {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        if (link.includes('wa.me')) {
          if (link.includes('text=')) {
            pass(`WhatsApp link looks valid: ${link.substring(0, 50)}...`);
          } else {
            warn(`WhatsApp link is missing pre-filled text param: ${link}`);
          }
        }
      } else if (link.startsWith('#')) {
        warn(`Relative home hash links '${link}' should start with '/#' to work across subpages.`);
      } else if (link.startsWith('/#')) {
        pass(`Cross-page home hash link '${link}' is valid.`);
      } else if (link.startsWith('/vitrine') || link.startsWith('/pacote') || link === '/') {
        // Validate subpage target slug
        if (link.startsWith('/vitrine/')) {
          const categorySlug = link.substring('/vitrine/'.length);
          const catExists = db?.categories.some(cat => cat.slug === categorySlug);
          if (catExists) {
            pass(`Subpage link '${link}' points to valid category.`);
          } else {
            fail(`Subpage link '${link}' points to non-existent category Slug!`);
          }
        } else if (link.startsWith('/pacote/')) {
          const packageSlug = link.substring('/pacote/'.length);
          const pkgExists = db?.packages.some(pkg => pkg.slug === packageSlug);
          if (pkgExists) {
            pass(`Subpage link '${link}' points to valid package.`);
          } else {
            fail(`Subpage link '${link}' points to non-existent package Slug!`);
          }
        } else {
          pass(`Local routing link '${link}' is valid.`);
        }
      } else {
        warn(`Unrecognized href pattern: '${link}'`);
      }
    });

    // Check image src paths
    srcs.forEach(src => {
      if (src.startsWith('/')) {
        const localPath = path.join(__dirname, 'public', src.substring(1));
        const rootLocalPath = path.join(__dirname, src.substring(1));
        if (fs.existsSync(localPath) || fs.existsSync(rootLocalPath)) {
          pass(`HTML image source '${src}' exists on disk.`);
        } else {
          fail(`HTML image source '${src}' is broken!`);
        }
      } else if (src.startsWith('http')) {
        pass(`External HTML image source: '${src}'`);
      } else {
        fail(`HTML image source '${src}' must be absolute (start with a '/').`);
      }
    });

  } else {
    fail("index.html is missing in root!");
  }
} catch (e) {
  fail(`Error reading index.html: ${e.message}`);
}

console.log("\n==========================================================================");
console.log(`QA AUDIT COMPLETED: \x1b[31m${errors} Errors\x1b[0m, \x1b[33m${warnings} Warnings\x1b[0m`);
console.log("==========================================================================");

if (errors > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
