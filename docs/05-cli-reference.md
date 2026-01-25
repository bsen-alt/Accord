# CLI Reference

The Accord CLI is your safety net. It allows you to validate configuration files and dry-run authorization checks without starting a web server or writing code.

This is particularly useful in **CI/CD pipelines** to ensure that a policy change doesn't break your security model before you deploy it.

## Installation

You can run the CLI directly using `npx` (requires no global installation):

```bash
npx @navirondynamics/accord [command] [options]
```

Alternatively, install globally for convenience:

```bash
npm install -g @navirondynamics/accord
accord [command] [options]
```

---

## 1. The `validate` Command

Use this command to check if your policy or identity files are syntactically correct and structurally valid according to the Zod schema.

**Syntax:**

```bash
accord validate <file_path>
```

**Examples:**

Validate a JSON policy:

```bash
accord validate ./config/policies.json
```

Validate a YAML identity file:

```bash
accord validate ./config/identities.yaml
```

**Exit Codes:**

- `0`: Success. The file is valid.
- `1`: Failure. Syntax error or Schema validation error.

**Output Example (Success):**

```text
Validating ./config/policies.json...
✓ Valid! Loaded 15 policies.
```

**Output Example (Failure):**

```text
Validating ./config/policies.yaml...
✗ Validation Failed:
  "effect": Invalid enum value. Expected 'allow' | 'deny', received 'grant'
```

---

## 2. The `eval` Command (Evaluation)

The `eval` command simulates an access request (`accord.check`). It loads your configuration and asks "Should this user be allowed to do this action?"

**Syntax:**

```bash
accord eval -i <userId> -a <action> -r <resourceType> [options]
```

### Flags

| Flag    | Alias        | Required | Description                                                   |
| :------ | :----------- | :------- | :------------------------------------------------------------ |
| `-i`    | `--id`       | **Yes**  | The User/Identity ID (e.g., `alice`).                         |
| `-a`    | `--action`   | **Yes**  | The action to test (e.g., `delete`).                          |
| `-r`    | `--resource` | **Yes**  | The Resource Type (e.g., `booking`).                          |
| `--rid` |              | No       | The specific Resource ID (e.g., `b123`).                      |
| `-p`    | `--policy`   | No       | Path to policies file. Default: `./config/policies.json`.     |
| `-u`    | `--user`     | No       | Path to identities file. Default: `./config/identities.json`. |

### Examples

**Basic Allow Check:**

```bash
accord eval -i alice -a delete -r booking
```

**Check with Specific Resource ID:**

```bash
accord eval -i alice -a update -r document --rid doc_55
```

**Check with Custom Paths:**

```bash
accord eval -i bob -a read -r report -p ./prod/policies.yaml -u ./prod/identities.json
```

### Output

The command returns the full JSON decision object to `stdout`.

**Allow Output:**

```json
{
  "decision": "allow",
  "policy_id": "policy-admin-delete",
  "reason": "Allowed by matching policy"
}
```

**Deny Output:**

```json
{
  "decision": "deny",
  "reason": "No matching policy found (Default Deny)"
}
```

### CI/CD Integration

The `eval` command returns an exit code of `1` if access is **Denied**. This allows you to fail build steps if specific critical permissions are accidentally removed.

**Example `package.json` Script:**

```json
{
  "scripts": {
    "test-critical-access": "accord eval -i root_admin -a delete -r config || exit 1"
  }
}
```

---

## 3. Global Help

To see a list of all available commands and global flags:

```bash
accord --help
```

```text
Usage: accord [options] [command]

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  validate <file>          Validate a policy JSON file
  eval                     Evaluate an access request
  help [command]           display help for command
```

---

## Troubleshooting

**Error: `Policy validation failed`**

- Your YAML/JSON syntax might be correct, but the _structure_ is wrong.
- Check if required fields like `id`, `version`, `effect`, `subject`, `action`, and `resource` are present.
- Ensure the `effect` field is exactly `"allow"` or `"deny"`.

**Error: `Identity not found` (during `eval`)**

- The User ID (`-i`) provided does not exist in your identities file.
- Ensure the `id` in `identities.json` matches exactly what you passed to the CLI.

---

## End of Documentation

You have reached the end of the Accord v1.1 documentation.

- **Installation:** Go back to [Getting Started](01-getting-started.md).
- **Code:** Visit the [GitHub Repository](https://github.com/navirondynamics/accord) for source code and issues.

```

```
