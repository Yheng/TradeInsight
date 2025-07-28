import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '@/components/common/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner.querySelector('svg')).toHaveClass('w-8', 'h-8')
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner.querySelector('svg')).toHaveClass('w-4', 'h-4')
  })

  it('displays loading text', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})