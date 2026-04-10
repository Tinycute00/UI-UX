import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const source = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');
const lines = source.split('\n');

const partials = [
  ['src/partials/icons/sprite.html', 13, 58],
  ['src/partials/shell/sidebar.html', 62, 146],
  ['src/partials/shell/topbar.html', 153, 167],
  ['src/partials/views/dashboard.html', 172, 393],
  ['src/partials/views/morning.html', 395, 429],
  ['src/partials/views/daily.html', 431, 479],
  ['src/partials/views/ir.html', 481, 560],
  ['src/partials/views/ncr.html', 562, 590],
  ['src/partials/views/material.html', 592, 628],
  ['src/partials/views/safety.html', 630, 734],
  ['src/partials/views/sub.html', 736, 751],
  ['src/partials/views/billing.html', 753, 786],
  ['src/partials/views/docs.html', 788, 813],
  ['src/partials/mobile/bottom-nav.html', 820, 843],
  ['src/partials/mobile/drawer.html', 845, 864],
  ['src/partials/modals/actions.html', 870, 1060],
  ['src/partials/modals/material-ncr.html', 1062, 1101],
  ['src/partials/modals/detail-panels.html', 1103, 1232],
  ['src/partials/modals/supporting.html', 1234, 1375],
  ['src/partials/modals/work-contracts.html', 1378, 1449],
];

function pick(start, end) {
  return `${lines
    .slice(start - 1, end)
    .join('\n')
    .trimEnd()}\n`;
}

for (const [filePath, start, end] of partials) {
  const absolutePath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, pick(start, end), 'utf8');
}

const template = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>大成工程 PMIS — 工地管理資訊系統</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
<body>
<!-- @include ./src/partials/icons/sprite.html -->

<div class="app">
<!-- @include ./src/partials/shell/sidebar.html -->

<div class="main">
<!-- @include ./src/partials/shell/topbar.html -->

  <div class="content">
<!-- @include ./src/partials/views/dashboard.html -->
<!-- @include ./src/partials/views/morning.html -->
<!-- @include ./src/partials/views/daily.html -->
<!-- @include ./src/partials/views/ir.html -->
<!-- @include ./src/partials/views/ncr.html -->
<!-- @include ./src/partials/views/material.html -->
<!-- @include ./src/partials/views/safety.html -->
<!-- @include ./src/partials/views/sub.html -->
<!-- @include ./src/partials/views/billing.html -->
<!-- @include ./src/partials/views/docs.html -->
  </div><!-- /content -->
</div><!-- /main -->

</div><!-- /app -->

<!-- @include ./src/partials/mobile/bottom-nav.html -->
<!-- @include ./src/partials/mobile/drawer.html -->

<!-- @include ./src/partials/modals/actions.html -->
<!-- @include ./src/partials/modals/material-ncr.html -->
<!-- @include ./src/partials/modals/detail-panels.html -->
<!-- @include ./src/partials/modals/supporting.html -->
<!-- @include ./src/partials/modals/work-contracts.html -->

<!-- TOAST -->
<div class="tw-wrap" id="tw-wrap"></div>

<script type="module" src="/src/main.js"></script>
</body>
</html>
`;

fs.writeFileSync(indexPath, template, 'utf8');
