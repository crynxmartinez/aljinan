# Contributing to Tasheel

Thank you for your interest in contributing to Tasheel! This document provides guidelines and instructions for contributing.

---

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

---

## 🔀 Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-changed` - Documentation updates
- `refactor/what-refactored` - Code refactoring
- `test/what-tested` - Test additions

---

## 💬 Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance

**Examples:**
```
feat(work-orders): add recurring work order support

fix(auth): resolve session timeout issue

docs(readme): update setup instructions
```

---

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types/interfaces for all data structures
- Avoid `any` type
- Use meaningful variable names

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### File Organization

```
src/
├── app/              # Next.js pages and routes
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── modules/     # Feature-specific components
│   └── layout/      # Layout components
├── lib/             # Utility functions
└── types/           # TypeScript types
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Functions:** camelCase (`getUserData()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Files:** kebab-case (`user-profile.tsx`)

---

## 🧪 Testing

### Before Submitting PR

- [ ] Code builds without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] All features work as expected
- [ ] No console errors
- [ ] Tested on mobile and desktop
- [ ] Database migrations work (if applicable)

### Manual Testing Checklist

- [ ] User authentication works
- [ ] Forms validate correctly
- [ ] File uploads work
- [ ] API routes respond correctly
- [ ] UI is responsive
- [ ] No broken links

---

## 📚 Documentation

### Update Documentation When:

- Adding new features
- Changing API routes
- Modifying database schema
- Updating environment variables
- Changing configuration

### Documentation Files

- `README.md` - Overview and quick start
- `ARCHITECTURE.md` - System architecture
- `FEATURES.md` - Feature documentation
- `SETUP.md` - Setup instructions
- `API-DOCUMENTATION.md` - API reference
- `DEPLOYMENT.md` - Deployment guide

---

## 🔐 Security

### Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data before database queries
- Use parameterized queries (Prisma handles this)
- Implement rate limiting on API routes
- Follow OWASP security best practices

### Reporting Security Issues

**Do NOT create public issues for security vulnerabilities.**

Email security concerns to: security@tasheel.sa

---

## 🎨 UI/UX Guidelines

### Design Principles

- **Consistency** - Use existing components and patterns
- **Simplicity** - Keep interfaces clean and intuitive
- **Accessibility** - Follow WCAG guidelines
- **Responsiveness** - Mobile-first design

### Component Library

Use shadcn/ui components:
- Button, Input, Select, etc.
- Maintain consistent styling
- Follow Radix UI accessibility patterns

### Tailwind CSS

- Use utility classes
- Follow existing spacing scale
- Use theme colors
- Avoid custom CSS when possible

---

## 🗄️ Database Changes

### Schema Changes

1. Modify `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name migration_name`
3. Test migration locally
4. Document changes in PR
5. Update related TypeScript types

### Migration Guidelines

- Always create migrations for schema changes
- Test migrations on sample data
- Provide rollback instructions
- Document breaking changes

---

## 📦 Dependencies

### Adding Dependencies

1. Check if dependency is necessary
2. Verify package is actively maintained
3. Check bundle size impact
4. Install: `npm install package-name`
5. Document why it's needed in PR

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages (carefully!)
npm update
```

---

## 🔄 Pull Request Process

### Before Submitting

1. Update your branch with latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. Run all checks:
   ```bash
   npm run lint
   npm run build
   ```

3. Write clear PR description:
   - What changed
   - Why it changed
   - How to test
   - Screenshots (if UI changes)

### PR Review Process

1. Automated checks must pass
2. At least 1 approval required
3. No merge conflicts
4. All comments addressed
5. Owner merges to `main`

### After Merge

- Delete your feature branch
- Pull latest `main`
- Auto-deploys to production

---

## 🚀 Development Workflow

### Standard Workflow

1. **Create Issue** - Describe what you're working on
2. **Create Branch** - From latest `main`
3. **Develop** - Make changes locally
4. **Test** - Thoroughly test changes
5. **Commit** - With clear messages
6. **Push** - To your fork
7. **PR** - Open pull request
8. **Review** - Address feedback
9. **Merge** - Owner merges
10. **Deploy** - Auto-deploys to production

### Local Development

```bash
# Start dev server
npm run dev

# View database
npx prisma studio

# Check types
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build
```

---

## 📞 Getting Help

### Resources

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@tasheel.sa

### Questions?

- Check existing documentation first
- Search closed issues
- Ask in GitHub Discussions
- Contact maintainers

---

## ✅ Contributor Checklist

Before submitting your first PR:

- [ ] Read this contributing guide
- [ ] Set up local development environment
- [ ] Understand the codebase structure
- [ ] Review existing code style
- [ ] Test your changes thoroughly
- [ ] Write clear commit messages
- [ ] Update documentation
- [ ] Follow security guidelines

---

## 🎯 Good First Issues

Look for issues labeled:
- `good first issue` - Easy for beginners
- `help wanted` - Maintainers need help
- `documentation` - Documentation improvements

---

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

### Enforcement

Violations may result in:
- Warning
- Temporary ban
- Permanent ban

Report violations to: conduct@tasheel.sa

---

## 🙏 Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Credited in documentation

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Tasheel!** 🎉

**Questions?** Email: support@tasheel.sa  
**Last Updated:** March 2026
