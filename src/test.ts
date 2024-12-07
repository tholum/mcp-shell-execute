import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function main() {
  // Start the server process
  const serverProcess = spawn('node', ['--loader', 'ts-node/esm', 'src/index.ts'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Create client transport
  const transport = new StdioClientTransport({
    input: serverProcess.stdout,
    output: serverProcess.stdin
  });

  // Create client
  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // Test 1: Execute a simple command
    console.log('Testing command execution...');
    const result = await client.request("execute.command", {
      command: 'echo "Hello, World!"'
    });
    console.log('Command result:', result);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 