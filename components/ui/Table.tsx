// components/ui/Table.tsx - Table Component

interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 border-b">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-6 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={String(row[keyField])}
              className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
