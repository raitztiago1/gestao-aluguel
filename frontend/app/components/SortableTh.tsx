'use client';

type SortDirection = 'asc' | 'desc';

type SortableThProps = {
  label: string;
  sortKey: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
};

export default function SortableTh({ label, sortKey, activeKey, direction, onSort }: SortableThProps) {
  const isActive = activeKey === sortKey;
  const ariaSort = isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th aria-sort={ariaSort}>
      <button
        type='button'
        className='table-sort-button'
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );
}
