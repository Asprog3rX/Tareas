const fs = require('fs');
const path = require('path');

console.log('=== VERIFICACIÓN DEL BUILD ===');

const buildPath = path.join(__dirname, 'build');
console.log('Ruta del build:', buildPath);
console.log('¿Existe build?', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  console.log('Contenido del directorio build:');
  const files = fs.readdirSync(buildPath);
  files.forEach(file => {
    const filePath = path.join(buildPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file} - ${stats.isDirectory() ? 'Directorio' : 'Archivo'}`);
  });

  const indexPath = path.join(buildPath, 'index.html');
  console.log('\n¿Existe index.html?', fs.existsSync(indexPath));
  
  if (fs.existsSync(indexPath)) {
    console.log('index.html encontrado correctamente');
  } else {
    console.error('❌ ERROR: index.html no encontrado en el build');
  }
} else {
  console.error('❌ ERROR: La carpeta build no existe');
  console.log('\nPara crear el build:');
  console.log('1. Ve al directorio frontend');
  console.log('2. Ejecuta: npm run build');
  console.log('3. Copia la carpeta build al directorio backend');
}

console.log('\n=== FIN DE VERIFICACIÓN ==='); 