#!/usr/bin/env node
/**
 * Greenwood MCP server (stdio). The tools and the registry resource live in `server.ts`.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGreenwoodServer } from "./server.js";

await createGreenwoodServer().connect(new StdioServerTransport());
