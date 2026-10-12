import type { DefaultCellComponentProps, DefaultServerCellComponentProps, PayloadComponent } from 'payload'

/** The list-view cell for a checkbox, with the words for its two states (components/admin/BooleanCell.tsx). */
export function booleanCell(
  on = 'Yes',
  off = 'No',
): PayloadComponent<DefaultServerCellComponentProps, DefaultCellComponentProps> {
  return { path: '/components/admin/BooleanCell#BooleanCell', clientProps: { on, off } }
}
