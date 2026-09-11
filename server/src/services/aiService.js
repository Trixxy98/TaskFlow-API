const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/database");
const { assertCanCreateTask, withUserLock } = require("./subscriptionService");
const taskValidators = require("../validators/task.validators");

const MAX_TOOL_ROUNDS = 8;
const MAX_TASK_LIMIT = 50;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TOOLS = [
    {
        functionDeclarations: [
            {
                name: "get_tasks",
                description: "Get all user tasks",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        status: {
                            type: "STRING",
                            description: "Filter: 'pending' or 'completed'",
                        },
                        limit: {
                            type: "NUMBER",
                            description: "Number of tasks (default 10)",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "create_task",
                description: "Create a new task",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: {
                            type: "STRING", description: "Task title"
                        },
                        description: {
                            type: "STRING", description: "Task description"
                        },
                        priority: {
                            type: "STRING",
                            description: "Priority: low, medium, or high",
                        },
                        due_date: {
                            type: "STRING",
                            description: "Due date format: YYYY-MM-DD"
                        },
                    },
                    required: ["title"],
                },
            },
            {
                name: "update_task",
                description: "Update an existing task",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        task_id: {type: "NUMBER", description: "Task ID"},
                        title: {type: "STRING"},
                        status: {type: "STRING", description: "pending or completed"},
                        priority: {type: "STRING"},
                        due_date: {type: "STRING"},
                    },
                    required: ["task_id"],
                },
            },
            {
                name: "delete_task",
                description: "Delete a task",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        task_id: {type: "NUMBER", description: "ID of the task to delete"},
                    },
                    required: ["task_id"],
                },
            },
            {
                name: "get_projects",
                description: "Get all user projects",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: [],
                },
            },
        ],
    },
]

const toSqlDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const validatePayload = (schema, payload) => {
    const { error, value } = schema.validate(payload, { abortEarly: true, stripUnknown: true });
    if (error) return { ok: false, error: error.details[0].message };
    return { ok: true, value };
};

const executeTool = async (userId, toolName, toolArgs) => {
    switch (toolName) {
        case "get_tasks": {
            const { status, limit = 10 } = toolArgs;
            const parsed = Number(limit);
            const safeLimit = Number.isFinite(parsed)
                ? Math.min(MAX_TASK_LIMIT, Math.max(1, Math.trunc(parsed)))
                : 10;
            let where = "WHERE user_id = ?";
            const params = [userId];
            if (status === "pending" || status === "completed") {
                where += " AND status = ?";
                params.push(status);
            }
            const [tasks] = await db.query(
                `SELECT id, title, description, status, priority, due_date, project, created_at
                FROM tasks ${where} ORDER BY created_at DESC LIMIT ?`,
                [...params, safeLimit]
            );
            return { tasks, count: tasks.length };
        }

        case "create_task": {
            const validated = validatePayload(taskValidators.createTask, {
                title: toolArgs.title,
                description: toolArgs.description || null,
                priority: toolArgs.priority,
                due_date: toolArgs.due_date || null,
            });
            if (!validated.ok) return { success: false, error: validated.error };

            const { title, description, priority, due_date } = validated.value;
            try {
                return await withUserLock(userId, async (conn) => {
                    await assertCanCreateTask(userId, conn);
                    const [result] = await conn.query(
                        "INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?,?,?,?,?)",
                        [userId, title, description || null, priority || "medium", toSqlDate(due_date)]
                    );
                    const [[task]] = await conn.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
                    return { success: true, task };
                });
            } catch (err) {
                return {
                    success: false,
                    error: err.message,
                    code: err.code,
                    feature: err.feature,
                };
            }
        }

        case "update_task": {
            const { task_id, ...updates } = toolArgs;
            if (!Number.isInteger(Number(task_id)) || Number(task_id) <= 0) {
                return { success: false, error: "task_id must be a valid number" };
            }

            const validated = validatePayload(taskValidators.updateTask, updates);
            if (!validated.ok) return { success: false, error: validated.error };

            const [[existing]] = await db.query(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                [task_id, userId]
            );
            if (!existing) return { success: false, error: "Task not found" };

            const allowed = ["title", "status", "priority", "due_date", "description"];
            const next = { ...validated.value };
            if (next.due_date !== undefined) next.due_date = toSqlDate(next.due_date);

            const fields = Object.keys(next).filter((k) => allowed.includes(k));
            if (fields.length === 0) return { success: false, error: "No changes provided" };

            if (next.status === "completed") {
                next.kanban_status = "done";
                if (!fields.includes("kanban_status")) fields.push("kanban_status");
            } else if (next.status === "pending" && existing.kanban_status === "done") {
                next.kanban_status = "todo";
                if (!fields.includes("kanban_status")) fields.push("kanban_status");
            }

            const setClause = fields.map((f) => `${f} = ?`).join(", ");
            await db.query(`UPDATE tasks SET ${setClause} WHERE id = ?`, [
                ...fields.map((f) => next[f]),
                task_id,
            ]);

            const [[updated]] = await db.query("SELECT * FROM tasks WHERE id = ?", [task_id]);
            return { success: true, task: updated };
        }

        case "delete_task": {
            const {task_id} = toolArgs;
            const [[existing]] = await db.query(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                [task_id, userId]
            );
            if (!existing) return {success: false, error: "Task not found"};
            await db.query("DELETE FROM tasks WHERE id = ?", [task_id]);
            return {success: true, deleted: existing.title};
        }

        case "get_projects": {
            const [projects] = await db.query(
                "SELECT id, name, color FROM projects WHERE user_id = ?",
                [userId]
            );
            return {projects};
        }

        default:
            return {error: "Unknown tool"};
    }
};

const chat =  async (userId, userName, userMessage, history = []) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        tools: TOOLS,
        systemInstruction: `You are TaskFlow AI, a dedicated assistant for ${userName} to manage their tasks and projects.
Today is ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Always reply in English, even if the user writes in another language. Keep responses short and helpful.
When the user asks about tasks or wants to create/update/delete a task, do it immediately without asking for confirmation.

STRICT SCOPE: You ONLY handle topics related to task management, projects, productivity, and the TaskFlow application.
If the user asks about anything outside this scope (e.g. coding, general knowledge, math, recipes, news, etc.), politely decline and redirect them to ask about their tasks or projects instead.
Example refusal: "Sorry, I can only help with task and project management in TaskFlow. Is there anything about your tasks I can help with?"`,
    });

    const chatSession = model.startChat({history});
    let result = await chatSession.sendMessage(userMessage);
    let response = result.response;
    const executedActions = [];
    let rounds = 0;

    while (response.functionCalls()?.length > 0) {
        rounds += 1;
        if (rounds > MAX_TOOL_ROUNDS) {
            return {
                reply: "I had to stop after too many steps. Please try a simpler request.",
                actions: executedActions,
            };
        }

        const calls = response.functionCalls();
        const functionResults = [];

        for (const call of calls) {
            const toolResult = await executeTool(userId, call.name, call.args);
            executedActions.push({ tool: call.name, args: call.args, result: toolResult });
            functionResults.push({
                functionResponse: { name: call.name, response: toolResult },
            });
        }

        result = await chatSession.sendMessage(functionResults);
        response = result.response;
    }

    return {reply: response.text(), actions: executedActions};
};

module.exports = {chat};