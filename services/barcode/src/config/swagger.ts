import swaggerJsdoc from 'swagger-jsdoc';
import { getServerBaseUrl } from '../utils/serverBaseUrl';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plan & Plate — Barcode API',
      version: '1.0.0',
      description: 'REST API for the Barcode microservice',
    },
    servers: [{ url: getServerBaseUrl()  || `http://localhost:${process.env.PORT || 8080}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

export default swaggerSpec;
