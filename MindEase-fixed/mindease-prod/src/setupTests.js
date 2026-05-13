// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock all external dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', state: null }),
  useParams: () => ({}),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  Navigate: () => null,
}), { virtual: true });

jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    h1: 'h1',
    p: 'p',
    button: 'button',
    nav: 'nav',
  },
  AnimatePresence: ({ children }) => children,
}), { virtual: true });

jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}), { virtual: true });

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user',
    user: null,
    currentUser: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}), { virtual: true });
