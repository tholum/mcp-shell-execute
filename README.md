# MCP Shell Execute

A Model Context Protocol (MCP) capability for executing shell commands.

## Installation

```bash
npm install mcp-shell-execute
```

## Usage

### In your MCP configuration

Add the shell execute capability to your MCP configuration:

```json
{
  "capabilities": {
    "shell": {
      "provider": "mcp-shell-execute"
    }
  }
}
```

### API

The shell execute capability provides one method:

#### execute.command

Executes a shell command and returns its output.

**Parameters:**
- `command` (string, required): The command to execute
- `timeout` (number, optional): Timeout in milliseconds (default: 60000)

**Returns:**
- `stdout` (string): Standard output from the command
- `stderr` (string): Standard error from the command
- `exitCode` (number): Exit code from the command (0 for success)

**Example:**

```json
// Request
{
  "method": "execute.command",
  "params": {
    "command": "echo 'Hello, World!'",
    "timeout": 5000
  }
}

// Response
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exitCode": 0
}
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build:
```bash
npm run build
```

3. Run in development mode:
```bash
npm run dev
```

## Security Considerations

This capability executes shell commands on the host system. Make sure to:
1. Validate and sanitize input commands
2. Run with appropriate permissions
3. Consider using a restricted shell or command whitelist for production use 