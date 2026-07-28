const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description:
        "RESTful API for TaskFlow — a full-stack task management application with AI chatbot support.",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token obtained from /api/auth/login",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_id: { type: "integer", example: 1 },
            title: { type: "string", example: "Siapkan laporan bulanan" },
            description: { type: "string", example: "Laporan untuk bulan Julai" },
            status: { type: "string", enum: ["pending", "completed"], example: "pending" },
            priority: { type: "string", enum: ["low", "medium", "high"], example: "high" },
            due_date: { type: "string", format: "date", example: "2026-07-31" },
            project: { type: "string", example: "Work" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Work" },
            color: { type: "string", example: "#6366f1" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            message: { type: "string", example: "Task due tomorrow" },
            is_read: { type: "boolean", example: false },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Feedback: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1 },
            message: { type: "string", example: "This task needs more detail" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1 },
            filename: { type: "string", example: "1721234567-123456789.pdf" },
            originalname: { type: "string", example: "report.pdf" },
            mimetype: { type: "string", example: "application/pdf" },
            size: { type: "integer", example: 204800 },
            url: { type: "string", example: "/uploads/1721234567-123456789.pdf" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
