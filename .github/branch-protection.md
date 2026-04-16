# Branch Protection For `main`

Configure this in GitHub after pushing the workflow:

1. Open `Settings` -> `Branches` in the repository.
2. Add a branch protection rule for `main`.
3. Enable `Require a pull request before merging`.
4. Set `Require approvals` to `2`.
5. Enable `Require status checks to pass before merging`.
6. Select these required checks after the workflow runs once:
   - `Frontend Build`
   - `Backend Build`
7. Optionally enable `Dismiss stale pull request approvals when new commits are pushed`.
8. Optionally enable `Require conversation resolution before merging`.

Deployment model:

- Vercel auto-deploys the frontend after merges to `main`.
- Render auto-deploys the backend after merges to `main`.
- GitHub Actions blocks broken frontend/backend builds before merge.
