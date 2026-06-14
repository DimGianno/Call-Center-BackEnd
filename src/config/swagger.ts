import swaggerJSDoc from "swagger-jsdoc";

const localServerUrl = `http://localhost:${process.env.PORT || 3000}`;
const stagingServerUrl = "https://staging-4b8t.onrender.com";
const isStagingDeployment = process.env.NODE_ENV === "staging";

const serverUrl = isStagingDeployment ? stagingServerUrl : localServerUrl;
const serverDescription = isStagingDeployment
    ? "Staging server"
    : "Local development server";

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Call Center Backend API",
            version: "1.0.0",
            description:
                "REST API for managing call center records, notes, archive status, filters, and pagination."
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        servers: [
            {
                url: serverUrl,
                description: serverDescription
            }
        ]
    },
    apis: ["./src/routes/*.ts"]
});
