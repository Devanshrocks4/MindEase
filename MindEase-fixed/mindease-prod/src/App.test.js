import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MindEase app without crashing', () => {
  render(<App />);
  // Check that the app renders without throwing errors
  expect(document.body).toBeInTheDocument();
});

test('renders main heading', () => {
  render(<App />);
  // The app should render the main MindEase AI heading
  const headingElement = screen.getByText(/MindEase AI/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders assessment categories', () => {
  render(<App />);
  // Should render the 9 assessment categories
  const stressElement = screen.getByText(/Stress & Anxiety/i);
  expect(stressElement).toBeInTheDocument();
});
