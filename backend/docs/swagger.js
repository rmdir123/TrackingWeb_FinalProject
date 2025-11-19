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
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],

    // ✅ เพิ่มส่วน securitySchemes ให้ Swagger รู้จัก Bearer token
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },

    // ✅ ให้ bearerAuth เป็น default security ของทุก endpoint
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // ✅ ให้สแกนทุกไฟล์ route ที่มีคอมเมนต์ @swagger
  apis: ['./routes/*.js', './routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
