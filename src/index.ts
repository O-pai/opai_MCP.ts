#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parse } from "opai-dsl/dist/opai_ps.js";
import { SimplePromptVisitor } from "opai-dsl/dist/visitors/simple_prompt.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "opai-mcp",
  version: "0.0.1",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

server.registerTool(
  'OPai',
  {
    title: 'OPai DSL to prompts',
    description: 'This is a tool for converting OPai DSL to prompts, then you can use the generated prompts to generate codes. The DSL definitions start from "```OPai DSL"',
    inputSchema: {
      lang: z.string().describe("language of the code, e.g. 'python', 'javascript'"),
      dsl: z.string().describe("OPai DSL to be convereted to prompts"),
    },
  },
  ({ lang, dsl}) => ({
    content: [{
      type: 'text',
      text: `You are a coding assistant. You will generate the best "${lang}" codes.\n` + parse(dsl + "\n").accept(new SimplePromptVisitor()),
    }]
  })
)

server.registerPrompt(
  'OPai Prompt',
  {
    title: 'Prompt to be used for OPai DSL conversion',
    description: 'Prompt to be used for OPai DSL conversion',
    argsSchema: {
      lang: z.string().describe("language of the code, e.g. 'python', 'javascript'"),
    }
  },
  ({ lang }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `lang: ${lang}\n` + '```OPai DSL\n; example DSL\n$Person: with id, name, age as fields\n\n# *get_user_by_id(id: user id) -> person: Person\n// get remote data by user id\nuses: ~fetch\n\n```\n',
      }
    }]
  })
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OPai DSL MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});