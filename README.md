# 🧙 Git Gandalf

> "You Shall Not Commit" (bad code)

A local LLM-powered pre-commit code reviewer that analyzes your staged changes and blocks commits with high-risk issues.

## Features

- **Local LLM**: Uses LM Studio or compatible OpenAI API endpoint
- **No Cloud Dependencies**: Everything runs on your machine
- **Simple Hook**: Raw git hook, no frameworks
- **Clear Feedback**: Terminal-based review output with color-coded severity

## Requirements

- **Node.js**: >= 18.0.0
- **LM Studio**: Running with a loaded model (or compatible OpenAI API)
- **Git**: Any recent version

## Installation

### 1. Clone or Copy Git Gandalf

```bash
# Clone the repository
git clone https://github.com/swarajspatil158/git-gandalf.git
cd git-gandalf
```

### 2. Set Up LM Studio

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a model (recommended: `qwen/qwen3-4b-2507` or similar)
3. Start the local server (default: `http://localhost:1234`)

### 3. Install the Git Hook

For each repository you want to protect:

First, get the path to your git-gandalf installation:

```bash
cd /path/to/git-gandalf
pwd
# Example: /home/swaraj/git-gandalf
```

Then, in your target repository, create the pre-commit hook with that path:

```bash
cd /path/to/your/project
chmod +x .git/hooks/pre-commit

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

GANDALF_DIR="/replace/this/with/your/git-gandalf/repo/path/here"

DIFF=$(git diff --cached --unified=3)
[ -z "$DIFF" ] && exit 0

echo "$DIFF" | node "$GANDALF_DIR/index.js"
EOF
```

## Usage

Once installed, Git Gandalf runs automatically on every commit:

```bash
git add .
git commit -m "Your commit message"
```

### Sample Output

```
╔═══════════════════════════════════════════════════════════════╗
║                       🧙 GIT GANDALF 🧙                       ║
║            "You Shall Not Commit" (bad code)                  ║
╚═══════════════════════════════════════════════════════════════╝

  ✗ COMMIT BLOCKED

Summary: Critical security vulnerability detected in user input handling.

Risk Level: HIGH
Files Reviewed: 3

Issues Found (1):

  ● [HIGH] src/api/users.js:42
    SQL injection vulnerability: user input directly concatenated into query

Commit blocked. Fix the issues above or use git commit --no-verify to bypass.
```

### Bypass the Hook

If you need to commit despite warnings:

```bash
git commit --no-verify -m "Emergency fix"
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LM_STUDIO_URL` | `http://localhost:1234/v1/chat/completions` | LLM API endpoint |
| `LLM_MODEL` | `qwen/qwen3-4b-2507` | Model to use |

Example:

```bash
export LM_STUDIO_URL="http://localhost:1234/v1/chat/completions"
export LLM_MODEL="qwen/qwen3-4b-2507"
```

## Policy Rules

Git Gandalf uses a simple, hardcoded policy:

| Risk Level | Action | Exit Code |
|------------|--------|-----------|
| LOW | ALLOW | 0 |
| MEDIUM | WARN (allow) | 0 |
| HIGH | BLOCK | 1 |

## Failure Modes

| Scenario | Behavior |
|----------|----------|
| LLM not running | WARN (allow commit) |
| LLM timeout | WARN (allow commit) |
| Malformed LLM output | BLOCK (fail safe) |
| Internal error | BLOCK (fail safe) |
| Empty diff | ALLOW |

## Limitations

- No interactive mode
- No configuration files (P0)
- No multi-model support
- No caching of reviews
- No telemetry

## Project Structure

```
git-gandalf/
├── index.js           # Main entry point
├── hooks/
│   └── pre-commit     # Git hook template
├── src/
│   ├── diffIntake.js  # STDIN reader + guardrails
│   ├── diffMetadata.js # Diff parser
│   ├── llmRunner.js   # LM Studio client
│   ├── prompt.js      # Review prompt
│   ├── normalize.js   # JSON normalizer
│   ├── policy.js      # Decision engine
│   ├── renderer.js    # Terminal output
│   └── exitCode.js    # Exit code mapping
├── package.json
└── README.md
```

## License

MIT
