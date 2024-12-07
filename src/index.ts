import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { promisify } from "util";
import { exec } from "child_process";
import { zodToJsonSchema } from "zod-to-json-schema";

const execAsync = promisify(exec);

// Define the parameter schema
const ExecuteCommandArgsSchema = z.object({
  command: z.string(),
  timeout: z.number().optional().default(60000)
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Server setup
const server = new Server(
  {
    name: "mcp-shell-execute",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "execute.command",
        description: "Execute a shell command with optional timeout",
        inputSchema: zodToJsonSchema(ExecuteCommandArgsSchema) as ToolInput,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name === "execute.command") {
      const parsed = ExecuteCommandArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for execute.command: ${parsed.error}`);
      }

      const { command, timeout } = parsed.data;

      try {
        // Create a promise that rejects after the timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Command execution timed out')), timeout);
        });

        // Execute the command with timeout
        const result = await Promise.race([
          execAsync(command),
          timeoutPromise
        ]) as { stdout: string; stderr: string };

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: 0
            }, null, 2)
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              stdout: '',
              stderr: errorMessage,
              exitCode: 1
            }, null, 2)
          }],
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Shell Execute Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 