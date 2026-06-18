const fs = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const pluralize = require('pluralize');

// 1. Đọc JSON cấu hình (UML AST)
const domainModel = JSON.parse(fs.readFileSync('./domain-model.json', 'utf8'));
const outDir = `./output/${domainModel.serviceName.toLowerCase()}`;

async function generateMicroservice() {
  console.log(`🚀 Bắt đầu sinh mã cho Microservice: ${domainModel.serviceName}...`);

  // 2. Tạo cấu trúc thư mục TMSA (Layered Architecture)
  await fs.ensureDir(outDir);
  await fs.ensureDir(`${outDir}/models`);
  await fs.ensureDir(`${outDir}/controllers`);
  await fs.ensureDir(`${outDir}/middlewares`);
  await fs.ensureDir(`${outDir}/routes`);

  // 3. Sinh mã DCSL (Entities)
  const entityTemplate = fs.readFileSync('./templates/entity.ejs', 'utf8');
  for (const entity of domainModel.entities) {
    const code = ejs.render(entityTemplate, { entity });
    fs.writeFileSync(`${outDir}/models/${entity.name}.js`, code);
    console.log(`S1 Model Generate: ${entity.name}.js`);
  }

  // 4. Sinh mã AGL (Controllers / Behaviors)
  const controllerTemplate = fs.readFileSync('./templates/controller.ejs', 'utf8');
  const ctrlCode = ejs.render(controllerTemplate, { 
    entity: domainModel.entities[0], 
    activities: domainModel.activities 
  });
  fs.writeFileSync(`${outDir}/controllers/${domainModel.entities[0].name}Controller.js`, ctrlCode);
  console.log(`S2 Controller Generate (AGL Behavior)`);

  // 5. Sinh mã RBACDom (Security)
  const rbacTemplate = fs.readFileSync('./templates/rbac.ejs', 'utf8');
  const rbacCode = ejs.render(rbacTemplate, {});
  fs.writeFileSync(`${outDir}/middlewares/rbac.js`, rbacCode);
  console.log(`S3 Middleware Generate (RBACDom)`);

  // 6. Khởi tạo file App entry (Express server cơ bản)
  const appCode = `
const express = require('express');
const app = express();
app.use(express.json());

// Load Routes...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('${domainModel.serviceName} running on port ' + PORT));
  `;
  fs.writeFileSync(`${outDir}/app.js`, appCode);

  console.log(`Complete: ${outDir}`);
}

generateMicroservice().catch(console.error);