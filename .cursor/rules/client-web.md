# Scope
Applies to:
- React (functional components)
- Next.js Client Components
- TypeScript (frontend)
- UI, styling, accessibility, and client-side state
- Client-side data fetching and forms
- Define clear component boundaries: separate route-level components, feature components, and reusable UI components
- Use /components/ui for generic UI primitives and /components/features for feature-specific components

# Development Philosophy

- Write clean, maintainable, and scalable UI code
- Prefer functional and declarative patterns
- Emphasize component-driven development
- Optimize for readability before premature performance optimizations
- Strong focus on UX, accessibility, and correctness

# Planning & Implementation
- Begin with step-by-step planning
- Write pseudocode before implementation
- Document component responsibilities and data flow
- In addition to loading, empty, error, and success states, define skeleton vs spinner usage, retry behavior, and optimistic UI patterns
- Prefer skeleton loaders for content-heavy views; use spinners only for short, blocking actions
- Explicitly consider edge cases and user interactions
- Define retry and backoff behavior for recoverable client-side errors


# Code Style
- Use tabs for indentation
- Use single quotes for strings
- Omit semicolons unless required
- Max line length: 120 characters
- Always use strict equality (===)
- Use trailing commas in multiline objects/arrays
- Space after commas and around infix operators
- Add space before function parentheses
- Keep else on the same line as closing brace
- Always use curly braces for multi-line conditionals
- Remove unused variables and imports

# Naming Conventions

## General
- PascalCase: React components, interfaces, types
- camelCase: variables, functions, hooks, props
- kebab-case: file names and directories
- UPPERCASE: constants, environment variables

## Patterns
- Event handlers: handleClick, handleSubmit
- Booleans: isLoading, hasError, canSubmit
- Hooks: useAuth, useForm
- Prefer full words
- Allowed abbreviations: err, props, ref
- React Best Practices
- Use function declarations for components
- Extract reusable logic into custom hooks
- Prefer composition over inheritance
- Use React.memo only when justified
- Always clean up effects in useEffect
  
## React Performance
- Use useCallback only when passing callbacks to memoized children or when referential stability is required
- Use useMemo only when computations are proven expensive or cause unnecessary re-renders
- Avoid inline functions in JSX only in performance-sensitive paths (e.g. large lists or memoized children)
- Use dynamic imports for code splitting
- Never use array index as list key

## Next.js (Client-Side)
- Use App Router conventions
- Use built-in components:
  - next/image
  - next/link
  - next/script
- Implement loading and error states
- Default to server-side data fetching; use client-side fetching only for interactive or user-specific data
- Define caching and revalidation rules for all server data (static, revalidated, or dynamic)
- Document when to use Server Actions versus client-side mutations

## Client Components Rules
- Add 'use client' only when required
  - Event handlers
  - Browser-only APIs
  - Client-side state
  - Client-only libraries
- Keep Client Components as thin as possible

## TypeScript (Client)
- Establish a single TypeScript typing philosophy and apply it consistently across the repo
- Enable strict mode
- Use type for props and component state; reserve interface only for declaration merging or public APIs
- Use utility types (Partial, Pick, Omit)
- Use generics where flexibility is required
- Use type guards for nullable data

## UI & Styling
- Use Tailwind CSS with a consistent class composition strategy (e.g. clsx or cva)
- Follow mobile-first responsive design
- Maintain consistent spacing and sizing
- Support dark mode via Tailwind and CSS variables using a single theming strategy
- Ensure color contrast meets accessibility standards
- Prefer composition over monolithic component
- Use design tokens via CSS variables for spacing, colors, and typography
- Define component variants explicitly instead of conditionally composing large class strings
- Ensure all interactive elements support keyboard navigation and visible focus states
- Enforce accessible form patterns: labels, error associations, and ARIA only when necessary

# Testing and Tooling
- Adopt ESLint with TypeScript and React rules enabled
- Use Prettier as the source of truth for formatting; do not hand-format code
- Define a client testing stack (React Testing Library for unit tests, Playwright or Cypress for E2E)