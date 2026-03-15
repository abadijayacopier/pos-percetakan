import fs from 'fs';

let file = 'd:/WEB/pos/client/src/pages/DesignerDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// remove db import
content = content.replace("import db from '../db';\r\n", "");
content = content.replace("import db from '../db';\n", "");

// remove localStorage fetching
content = content.replace(/\/\/ Enrich with dp_tasks data from localStorage[\s\S]*?setTasks\(enriched\);/m, 'setTasks(data);');

// update usages
content = content.replace(/activeTask\.dpTask/g, 'activeTask');
content = content.replace(/t\.dpTask/g, 't');
content = content.replace(/customerName/g, 'customer_name');
content = content.replace(/title/g, 'product_name');
content = content.replace(/material_name/g, 'specs_material');
content = content.replace(/pesan_desainer/g, 'specs_notes');

// replace dimensions with finishing
content = content.replace(/\{activeTask\.dimensions\?\.width\}m × \{activeTask\.dimensions\?\.height\}m/g, '{activeTask.specs_finishing || "-"}');

// remove db.update in submitFinish
content = content.replace(/\/\/ Update dp_task status in localStorage\r?\n\s*if \(finishingTask\.task_id\) \{\r?\n\s*db\.update\('dp_tasks', finishingTask\.task_id, \{ status: 'produksi' \}\);\r?\n\s*\}/g, '');

fs.writeFileSync(file, content);
console.log('Fixed DesignerDashboardPage.jsx variables');
