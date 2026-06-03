import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Call Center Backend API",
            version: "1.0.0",
            description:
                "REST API for managing call center records, notes, archive status, filters, and pagination."
        },
        servers: [
            {
                url: "https://call-center-backend-7z8r.onrender.com",
                description: "Production server"
            }
        ]
    },
    apis: ["./src/routes/*.ts"]
});
