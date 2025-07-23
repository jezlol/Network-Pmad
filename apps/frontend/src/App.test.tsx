import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  test('renders dashboard page', () => {
    render(<App />);
    const dashboardHeading = screen.getByRole('heading', { name: /Dashboard/i });
    expect(dashboardHeading).toBeInTheDocument();
  });

  test('renders welcome message', () => {
    render(<App />);
    const welcomeMessage = screen.getByText(/Welcome to the Network Monitoring App/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders metric cards with placeholders', () => {
    render(<App />);
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Online Devices')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
  });
}); 