import sinon from 'sinon'
import { expect } from 'chai'
import { screen, fireEvent } from '@testing-library/react'
import renderWithContext from '../../helpers/render-with-context'

import FileTreeitemMenu from '../../../../../../frontend/js/features/file-tree/components/file-tree-item/file-tree-item-menu'

describe('<FileTreeitemMenu />', function () {
  const setContextMenuCoords = sinon.stub()

  afterEach(function () {
    setContextMenuCoords.reset()
  })

  it('renders dropdown', function () {
    renderWithContext(
      <FileTreeitemMenu
        id="123abc"
        setContextMenuCoords={setContextMenuCoords}
      />
    )

    const toggleButton = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(toggleButton)

    screen.getByRole('menu')
  })

  it('open / close', function () {
    renderWithContext(
      <FileTreeitemMenu
        id="123abc"
        setContextMenuCoords={setContextMenuCoords}
      />
    )

    expect(screen.queryByRole('menu')).to.be.null

    const toggleButton = screen.getByRole('button', { name: 'Menu' })

    fireEvent.click(toggleButton)
    screen.getByRole('menu', { visible: true })

    fireEvent.click(toggleButton)
    screen.getByRole('menu', { visible: false })
  })
})
