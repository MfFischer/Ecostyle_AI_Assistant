# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing the repository owner. Please do not create a public GitHub issue for security vulnerabilities.

## Security Incident - March 2024

### Incident Summary

On March 8, 2024, a Google Gemini API key was accidentally committed to the repository in commit `35654ea`. This key has been:

1. ✅ Removed from all workflow files
2. ✅ Replaced with environment variable references
3. ✅ Documented in setup guides
4. ⚠️ **REQUIRES ROTATION** - The exposed key should be revoked and replaced

### Action Required

**If you cloned this repository before the security fix:**

1. **Rotate the API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Revoke the old API key: `AIzaSyAj0btu828R6Vz2275gMktnE7eOt53oJbQ`
   - Generate a new API key
   - Update your environment variables with the new key

2. **Update Your Local Repository**:
   ```bash
   git fetch origin
   git reset --hard origin/master
   ```

3. **Set Environment Variables**:
   ```bash
   export GEMINI_API_KEY="your-new-api-key-here"
   ```

### Prevention Measures

To prevent similar incidents in the future:

1. ✅ All API keys now use environment variables
2. ✅ Added `.env.example` files with placeholders
3. ✅ Updated `.gitignore` to exclude `.env` files
4. ✅ Added pre-commit hooks (recommended)
5. ✅ Created comprehensive security documentation

### Best Practices

**For Contributors:**

- Never commit API keys, passwords, or secrets
- Always use environment variables for sensitive data
- Review changes before committing
- Use tools like `git-secrets` or `gitleaks` to scan for secrets

**For Users:**

- Generate your own API keys
- Never share API keys publicly
- Rotate keys regularly
- Use different keys for development and production
- Monitor API usage for unusual activity

## Secure Configuration

### Environment Variables

All sensitive configuration should be stored in environment variables:

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional
QDRANT_URL=http://localhost:6333
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
```

### n8n Workflow Configuration

Workflows now reference environment variables using n8n's syntax:

```json
{
  "name": "key",
  "value": "={{ $env.GEMINI_API_KEY }}"
}
```

See `backend/n8n-workflows/README.md` for detailed setup instructions.

## Security Tools

### Recommended Tools

1. **git-secrets** - Prevents committing secrets
   ```bash
   git secrets --install
   git secrets --register-aws
   ```

2. **gitleaks** - Scans for secrets in git history
   ```bash
   gitleaks detect --source . --verbose
   ```

3. **pre-commit** - Runs checks before commits
   ```bash
   pip install pre-commit
   pre-commit install
   ```

### GitHub Secret Scanning

This repository uses GitHub's secret scanning feature to detect exposed secrets. If a secret is detected:

1. GitHub will create a security alert
2. The repository owner will be notified
3. The secret should be rotated immediately

## Contact

For security concerns, please contact:
- GitHub: [@MfFischer](https://github.com/MfFischer)

## Acknowledgments

We take security seriously and appreciate responsible disclosure of vulnerabilities.

