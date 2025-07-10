const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('=== DEBUG DE RUTAS ===');

// Simular el setup del servidor
const app = express();
const buildPath = path.join(__dirname, 'build');

console.log('📁 Ruta del build:', buildPath);
console.log('✅ ¿Existe build?', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  console.log('\n📋 Contenido del build:');
  const files = fs.readdirSync(buildPath);
  files.forEach(file => {
    const filePath = path.join(buildPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  📄 ${file} - ${stats.isDirectory() ? 'Directorio' : 'Archivo'}`);
  });

  const indexPath = path.join(buildPath, 'index.html');
  console.log('\n📄 ¿Existe index.html?', fs.existsSync(indexPath));
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html encontrado correctamente');
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log('📏 Tamaño del archivo:', content.length, 'caracteres');
  }
}

// Simular rutas que deberían funcionar
const testRoutes = [
  '/',
  '/login',
  '/register', 
  '/dashboard',
  '/api/tasks',
  '/api/stats'
];

console.log('\n🧪 Rutas de prueba:');
testRoutes.forEach(route => {
  console.log(`  ${route}`);
});

console.log('\n=== FIN DEBUG ==='); 