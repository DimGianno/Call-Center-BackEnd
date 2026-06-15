import swaggerJSDoc from "swagger-jsdoc";

const localServerUrl = `http://localhost:${process.env.PORT || 3000}`;
const serverUrl = process.env.API_BASE_URL || localServerUrl;

const getServerDescription = (): string => {
    if (process.env.NODE_ENV === "production") {
        return "Production server";
    }

    if (process.env.NODE_ENV === "staging") {
        return "Staging server";
    }

    return "Local development server";
};

const serverDescription = getServerDescription();

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Call Center Backend API",
            version: "1.0.0",
            description:
                "REST API for managing call center records, notes, archive status, filters, pagination, reset data, and authentication."
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
