export default function Table({
  columns = [],
  data = [],
  keyField = "id",
  onRowClick,
  emptyMessage = "No records found",
  className = "",
}) {
  return (
    <div className={`table-container ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                style={{
                  textAlign: col.align || "left",
                  width: col.width || "auto",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="table-empty-cell"
              >
                <div className="table-empty-state">
                  <div className="table-empty-icon">📂</div>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? "table-row-clickable" : ""}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    style={{ textAlign: col.align || "left" }}
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
