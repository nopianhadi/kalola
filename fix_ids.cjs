const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix p.id === something  => String(p.id) === String(something)
  // This targets: p.id === formData.packageId, c.id === id, etc.
  content = content.replace(/([a-zA-Z0-9_]+)\.id === ([a-zA-Z0-9_\.\?\']+)/g, (match, p1, p2) => {
    // If the right side is already Number(...) or String(...), skip
    if (p2.startsWith('Number') || p2.startsWith('String')) return match;
    // if right side is a number literal like 1 or '1', skip?
    if (/^\d+$/.test(p2)) return match;
    return `String(${p1}.id) === String(${p2})`;
  });

  // 1b. Fix something === p.id => String(something) === String(p.id)
  content = content.replace(/([a-zA-Z0-9_\.\?\']+) === ([a-zA-Z0-9_]+)\.id/g, (match, p1, p2) => {
    if (p1.startsWith('Number') || p1.startsWith('String')) return match;
    if (/^\d+$/.test(p1)) return match;
    return `String(${p1}) === String(${p2}.id)`;
  });

  // 1c. Fix !==
  content = content.replace(/([a-zA-Z0-9_]+)\.id !== ([a-zA-Z0-9_\.\?\']+)/g, (match, p1, p2) => {
    if (p2.startsWith('Number') || p2.startsWith('String')) return match;
    if (/^\d+$/.test(p2)) return match;
    return `String(${p1}.id) !== String(${p2})`;
  });

  // 2. Fix array.includes(addon.id) => array.includes(String(addon.id))
  content = content.replace(/\.includes\(([a-zA-Z0-9_]+)\.id\)/g, '.includes(String($1.id))');

  // 3. delete...Row(id) where id is string
  // deleteProjectRow, deleteClientRow, deleteContractRow
  content = content.replace(/(deleteProjectRow|deleteClientRow|deleteContractRow|deleteTransaction|deleteAddOn)\(([a-zA-Z0-9_]+)\)/g, (match, func, arg) => {
    // Don't wrap if it's already Number(id)
    if (arg.startsWith('Number')) return match;
    return `${func}(Number(${arg}))`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});
console.log('Regex auto-fix completed!');
