export const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Meal Planner API",
      version: "1.0.0",
      description: "API documentation for the Meal Planner microservice",
    },
    servers: [
      {
        url: "http://localhost:" + (process.env.PORT || 3000),
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};
