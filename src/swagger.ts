import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mind Map Generator API",
      version: "1.0.0",
      description: "API documentation for mind map generation and fetching",
    },
  },
  apis: ["./src/**/*.ts"], // adjust path if needed
};

export const swaggerSpec = swaggerJSDoc(options);
export const swaggerUiHandler = swaggerUi.serve;
export const swaggerDocHandler = swaggerUi.setup(swaggerSpec);
