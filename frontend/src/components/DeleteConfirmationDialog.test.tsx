import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog'

describe('DeleteConfirmationDialog', () => {
  it('requires an explicit destructive confirmation', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DeleteConfirmationDialog open title="Delete bookmark?" message="This cannot be undone." isPending={false} onCancel={vi.fn()} onConfirm={onConfirm} />)
    expect(onConfirm).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('disables actions while deletion is pending', () => {
    render(<DeleteConfirmationDialog open title="Delete bookmark?" message="This cannot be undone." isPending onCancel={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })
})
