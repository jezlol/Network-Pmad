import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header Component', () => {
  test('renders Network Monitoring App title', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const titleElement = screen.getByText(/Network Monitoring App/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Alerts/i)).toBeInTheDocument();
  });

  test('has proper CSS classes for styling', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-primary-600', 'text-white', 'shadow-lg');
  });

  test('navigation links are proper Link components', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText(/Dashboard/i);
    const inventoryLink = screen.getByText(/Inventory/i);
    
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    expect(inventoryLink.closest('a')).toHaveAttribute('href', '/inventory');
  });
}); 