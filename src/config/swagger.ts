import swaggerJSDoc from "swagger-jsdoc";

const serverUrl =
    process.env.NODE_ENV === "production"
        ? "https://staging-4b8t.onrender.com"
        : `http://localhost:${process.env.PORT || 3000}`;

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
                url: serverUrl,
                description:
                    process.env.NODE_ENV === "production"
                        ? "Production server"
                        : "Local development server"
            }
        ]
    },
    apis: ["./src/routes/*.ts"]
});
