import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileHeader } from '../MobileHeader';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MobileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="My Page" />
      </MemoryRouter>
    );
    expect(screen.getByText('My Page')).toBeInTheDocument();
  });

  it('renders back button when showBack is true', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Page" showBack />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('does not render back button when showBack is false', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Page" />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });

  it('calls custom onBack when provided', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeader title="Page" showBack onBack={onBack} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates back when no custom onBack is provided', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Page" showBack />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('renders menu button when onMenu is provided', () => {
    const onMenu = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeader title="Page" onMenu={onMenu} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it('renders search button when onSearch is provided', () => {
    const onSearch = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeader title="Page" onSearch={onSearch} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Search'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('renders rightActions content', () => {
    render(
      <MemoryRouter>
        <MobileHeader
          title="Page"
          rightActions={<button data-testid="custom-action">Action</button>}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Page" className="custom-class" />
      </MemoryRouter>
    );
    const header = screen.getByRole('banner');
    expect(header.className).toContain('custom-class');
  });

  it('has correct safe area styling', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Page" />
      </MemoryRouter>
    );
    const header = screen.getByRole('banner');
    expect(header).toHaveStyle({
      paddingTop: 'env(safe-area-inset-top, 0px)',
    });
  });
});
