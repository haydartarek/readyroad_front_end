// Read-only extraction of the existing web copy; outputs belong to Flutter.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const mobile = path.resolve(__dirname, '..');
const web = path.resolve(mobile, '../web_app');
const ts = require(path.join(web, 'node_modules/typescript'));
const languages = ['ar', 'en', 'nl', 'fr'];
const dictionaries = Object.fromEntries(languages.map(code => [code,
  JSON.parse(fs.readFileSync(path.join(web, 'src/messages', code + '.json'), 'utf8'))]));
const source = fs.readFileSync(path.join(web, 'src/lib/public-content.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
  exports: exportsObject,
  require(name) {
    if (name !== '@/lib/messages') throw Error('Unexpected public-content dependency: ' + name);
    return {translateMessage: (code, key) => dictionaries[code][key] ?? dictionaries.en[key] ?? key};
  },
});
const content = exportsObject.getAllPublicContent();
const signGroups = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(web, 'src/lib/sign-category-data.ts'), 'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports:signGroups});
const groupDart = '// Generated from the read-only web sign-category-data.ts.\n' +
  'const Map<String, dynamic> webSignGroups = ' + JSON.stringify(signGroups.GROUP_INFO, null, 2).replaceAll('$', '\\$') + ';\n' +
  'const List<String> webSignGroupOrder = ' + JSON.stringify(signGroups.GROUP_LETTER_ORDER) + ';\n';
fs.mkdirSync(path.join(mobile, 'lib/features/categories'), {recursive:true});
fs.writeFileSync(path.join(mobile, 'lib/features/categories/web_sign_groups.dart'), groupDart);
fs.mkdirSync(path.join(mobile, 'assets/web_reference'), {recursive: true});
fs.writeFileSync(path.join(mobile, 'assets/web_reference/public-content.json'), JSON.stringify(content, null, 2) + '\n');
const favorites = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(web, 'src/lib/road-sign-favorites.ts'), 'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports:favorites, require(name) { if(name !== '@/lib/api') throw Error('Unexpected favorites dependency: '+name); return {apiClient:{}}; },
  });
for (const code of languages) for (const [key,value] of Object.entries(favorites.favoriteCopy[code])) dictionaries[code]['favorites.web.'+key] = value;
const cms = {}, editorial = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(web,'src/lib/editorial-cms-copy.ts'),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:cms});
const labelSource = fs.readFileSync(path.join(web,'src/lib/editorial-ui-labels.ts'),'utf8') +
  '\nexport const nativeLabels = {lifecycleLabels,qualityGateLabels,taskStatusLabels,topicSourceLabels,claimTypeLabels,evidenceSourceTypeLabels,legalReviewStatusLabels,sourceLocationLabels,sourceTrustLabels,strategyOptionLabels};';
vm.runInNewContext(ts.transpileModule(labelSource,
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:editorial,Intl});
for(const code of languages){
  for(const [key,value] of Object.entries(cms.editorialCmsCopy(code))) dictionaries[code]['editorial.cms.'+key] = typeof value === 'function' ? value('{languages}') : value;
  for(const [key,value] of Object.entries(editorial.editorialWorkflowCopy(code))) dictionaries[code]['editorial.workflow.'+key] = value;
  for(const name of ['lifecycleLabels','qualityGateLabels']) for(const [key,value] of Object.entries(editorial.nativeLabels[name][code])) dictionaries[code]['editorial.'+name+'.'+key] = value;
  for(const name of ['taskStatusLabels','topicSourceLabels','claimTypeLabels','evidenceSourceTypeLabels','legalReviewStatusLabels','sourceLocationLabels','sourceTrustLabels']) for(const [key,value] of Object.entries(editorial.nativeLabels[name])) dictionaries[code]['editorial.'+name+'.'+key] = value[code];
  for(const [kind,items] of Object.entries(editorial.nativeLabels.strategyOptionLabels)) for(const [key,value] of Object.entries(items)) dictionaries[code]['editorial.strategy.'+kind+'.'+key] = value[code];
  dictionaries[code]['editorial.article_number'] = editorial.editorialArticleLabel('{number}',code);
  for(let n=1;n<=20;n++) dictionaries[code]['editorial.version.'+n] = editorial.editorialVersionLabel(n,code);
}
for (const [source,target] of [['logo.png','rijvia-wordmark.png'],['logo-dark.png','rijvia-wordmark-dark.png']]) {
  fs.copyFileSync(path.join(web,'public/images',source),path.join(mobile,'assets/branding',target));
}
fs.copyFileSync(path.join(web,'public/icons/icon-192.png'),path.join(mobile,'assets/branding/rijvia-auth-mark.png'));
for(const name of ['traffic-signs','practice','exam']) fs.copyFileSync(path.join(web,'public/images',name+'.png'),path.join(mobile,'assets/web_reference/blog-card-'+name+'.png'));
for (const code of languages) {
  const target = path.join(mobile, 'lib/l10n', code + '.json');
  const current = JSON.parse(fs.readFileSync(target, 'utf8'));
  fs.writeFileSync(target, JSON.stringify({...current, ...dictionaries[code]}, null, 2) + '\n');
  console.log(code + ': web messages=' + Object.keys(dictionaries[code]).length + '; documents=' + Object.keys(content[code].documents).length);
}

function pages(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? pages(file) : entry.name === 'page.tsx' ? [file] : [];
  });
}
const appRoot = path.join(web, 'src/app');
const routes = pages(appRoot).map(file => {
  const relative = path.relative(appRoot, path.dirname(file));
  const segments = relative.split(path.sep).filter(segment => segment && !/^\(.*\)$/.test(segment));
  const route = '/' + segments.join('/');
  return {route, source:path.relative(web, file).split(path.sep).join('/'),
    group:route.startsWith('/admin') ? 'admin' : relative.includes('(protected)') ? 'student'
      : relative.includes('(auth)') ? 'auth' : 'public'};
}).sort((a,b) => a.route.localeCompare(b.route));
fs.writeFileSync(path.join(mobile, 'assets/web_reference/routes.json'), JSON.stringify(routes, null, 2) + '\n');
console.log('Web page routes: ' + routes.length);
const planPath = path.join(mobile, 'WEB_MOBILE_SYNC_PLAN.md');
const marker = '## Full web to Flutter parity — 2026-10-15';
if (!fs.readFileSync(planPath, 'utf8').includes(marker)) {
  fs.appendFileSync(planPath, '\n' + marker + '\n\n' +
    'طلب المالك الجديد يشمل جميع صفحات الويب؛ يلغي استثناء الصفحات العامة والإدارة من جدول المطابقة القديم. الويب مرجع للقراءة فقط، وبصمات476 ملفًا محفوظة في output/web-reference-2026-10-15-sha256.json. Native billing/auth يبقيان مؤجلين بالقرار السابق؛ لا تغييرات باكيند أو قاعدة بيانات أو تبعيات أو نشر.\n\n' +
    'Feature: Complete native Flutter presentation parity\nScenario: Every web route has an explicit equivalent or the same redirect\nGiven the current read-only web page registry\nWhen the corresponding Flutter route opens for the same authorized role and language\nThen content, component hierarchy, states and actions follow the web source\nAnd unsupported or unverified work is never marked complete\n\n' +
    '| Web route | Role group | Audit status |\n| --- | --- | --- |\n' +
    routes.map(item => '| `' + item.route + '` | ' + item.group + ' | REVIEW REQUIRED |').join('\n') + '\n\n' +
    'هذه حالة بداية الفحص؛ لا تعني الأسماء الموجودة نجاح الصفحة أو مطابقتها. سيُحدّث الجدول بأدلة التنفيذ والاختبار، دون إبقاء صفحة خارج الحصر.\n');
}
