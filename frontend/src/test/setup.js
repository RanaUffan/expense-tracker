// Adds jest-dom's extra matchers (toBeInTheDocument, toHaveTextContent,
// etc.) to Vitest's `expect`, so component tests can make readable
// assertions about rendered DOM instead of raw querySelector checks.
import '@testing-library/jest-dom';
