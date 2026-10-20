type Name =
  | 'plus'
  | 'board'
  | 'arrow'
  | 'check'
  | 'edit'
  | 'trash'
  | 'grip'
  | 'close'
  | 'refresh'
  | 'sidebarClose'
  | 'sidebarOpen'
const paths: Record<Name, string> = {
  plus: 'M12 5v14M5 12h14',
  board: 'M4 4h16v16H4zM9 4v16M15 4v16',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  check: 'm5 12 4 4L19 6',
  edit: 'm15 5 4 4M4 20l4-1L20 7l-4-4L4 15z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7',
  grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  close: 'm6 6 12 12M6 18 18 6',
  refresh:
    'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1',
  sidebarClose:
    'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM9 3v18M17 9l-3 3 3 3',
  sidebarOpen:
    'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM9 3v18M14 9l3 3-3 3',
}
export function Icon({ name, size = 18 }: { name: Name; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'grip' ? 3 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
