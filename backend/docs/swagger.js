// docs/swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Tracking Package Website API',
      version: '1.0.0',
      description: 'Swagger docs (auto from route comments)',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local server' }],
  },
  // ✅ สำคัญมาก — ให้สแกนทุกไฟล์ route ที่มีคอมเมนต์ @swagger
  apis: ['routes/*.js', 'routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = { swaggerUi, swaggerSpec };
