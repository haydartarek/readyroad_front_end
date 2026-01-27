# ReadyRoad Testing Guide

## 🧪 Testing Setup

This project uses **Jest** and **React Testing Library** for unit and integration testing.

## 📦 Testing Dependencies

```json
{
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/react": "^14.1.2",
  "@testing-library/user-event": "^14.5.1",
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0"
}
```

## 🚀 Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage report

```bash
npm run test:coverage
```

## 📂 Test Files Structure

```
web_app/
├── src/
│   ├── contexts/
│   │   └── __tests__/
│   │       ├── auth-context.test.tsx
│   │       └── language-context.test.tsx
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/
│   │           └── button.test.tsx
│   └── lib/
│       └── __tests__/
│           └── utils.test.ts
├── jest.config.ts
└── jest.setup.ts
```

## ✅ Test Coverage

### Current Test Files

1. **Auth Context Tests** (`auth-context.test.tsx`)
   - Initial auth state
   - Successful login
   - Logout functionality
   - Login failure handling

2. **Language Context Tests** (`language-context.test.tsx`)
   - Default language (English)
   - Text translation
   - Language switching (EN, AR, NL, FR)
   - RTL direction for Arabic
   - LocalStorage persistence

3. **Button Component Tests** (`button.test.tsx`)
   - Rendering with text
   - Variant styles (primary, secondary)
   - Disabled state
   - Click handlers
   - Different sizes

4. **Utility Functions Tests** (`utils.test.ts`)
   - Email validation
   - Password validation
   - Time formatting
   - Date formatting

## 🎯 Testing Best Practices

### 1. **Test File Naming**

- Use `.test.tsx` or `.test.ts` extension
- Place tests in `__tests__` folder next to source files

### 2. **Test Structure**

```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something specific', () => {
    // Test implementation
  })
})
```

### 3. **Mocking**

```typescript
// Mock API calls
jest.mock('@/lib/api')

// Mock Next.js router (already configured in jest.setup.ts)
```

### 4. **Assertions**

```typescript
// Common assertions
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toHaveClass('className')
expect(element).toBeDisabled()
expect(fn).toHaveBeenCalledTimes(1)
```

## 📊 Coverage Goals

Target coverage: **80%+**

Current coverage areas:

- ✅ Contexts (Auth, Language)
- ✅ UI Components (Button)
- ✅ Utility Functions
- 🔜 Page Components
- 🔜 API Client
- 🔜 Custom Hooks

## 🔧 Jest Configuration

### `jest.config.ts`

- Test environment: `jsdom` (for React components)
- Coverage provider: `v8`
- Module name mapper for `@/` alias
- Matches `*.test.ts(x)` and `*.spec.ts(x)` files

### `jest.setup.ts`

- Imports `@testing-library/jest-dom`
- Mocks Next.js router
- Mocks `window.matchMedia`
- Mocks `localStorage`

## 🐛 Debugging Tests

### Run specific test file

```bash
npm test -- auth-context.test.tsx
```

### Run tests with verbose output

```bash
npm test -- --verbose
```

### Update snapshots

```bash
npm test -- --updateSnapshot
```

## 📝 Writing New Tests

### Example: Testing a Component

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Example: Testing Async Operations

```typescript
import { render, screen, waitFor } from '@testing-library/react'

it('should load data asynchronously', async () => {
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  })
})
```

## 🔄 Continuous Integration

Tests should run automatically on:

- Every commit
- Pull requests
- Before deployment

### CI Configuration (Example)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated:** January 27, 2026
