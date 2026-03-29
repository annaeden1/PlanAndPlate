import swaggerJsdoc from 'swagger-jsdoc';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plan & Plate — Grocery List API',
      version: '1.0.0',
      description: 'REST API for the Grocery List Manager microservice',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 8080}` }],
  },
  apis: ['./src/routes/*.ts'],
});

export default swaggerSpec;
