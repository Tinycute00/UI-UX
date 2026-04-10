import fs from 'node:fs';
import path from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+(.+?)\s*-->/g;

function resolveIncludes(source, fromFile, seen = new Set()) {
  return source.replace(INCLUDE_RE, (_, includePath) => {
    const cleanedPath = includePath.trim().replace(/^['"]|['"]$/g, '');
    const targetPath = path.resolve(path.dirname(fromFile), cleanedPath);

    if (seen.has(targetPath)) {
      throw new Error(`Circular HTML partial include detected: ${targetPath}`);
    }

    if (!fs.existsSync(targetPath)) {
      throw new Error(`HTML partial not found: ${targetPath}`);
    }

    seen.add(targetPath);
    const content = fs.readFileSync(targetPath, 'utf8');
    const resolved = resolveIncludes(content, targetPath, seen);
    seen.delete(targetPath);
    return resolved;
  });
}

export function htmlPartialsPlugin() {
  return {
    name: 'pmis-html-partials',
    transformIndexHtml(html, ctx) {
      const filename = ctx?.filename ?? path.resolve(process.cwd(), 'index.html');
      return resolveIncludes(html, filename);
    },
  };
}
