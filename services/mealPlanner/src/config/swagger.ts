import swaggerJsdoc from 'swagger-jsdoc';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plan & Plate — Meal Planner API',
      version: '1.0.0',
      description: 'REST API for the Meal Planner microservice',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 8080}` }],
  },
  apis: ['./src/routes/*.ts'],
});

export default swaggerSpec;