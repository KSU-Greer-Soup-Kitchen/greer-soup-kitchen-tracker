// Simple bar charts for the reports page. Every chart also has a plain table
// underneath, so the numbers can be read without the picture.

export type Point = { label: string; long?: string; value: number };

function DataTable({ points, unit, format }: { points: Point[]; unit: string; format: (n: number) => string }) {
  return (
    <details className="chart-table">
      <summary>Show as a table</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col"> </th>
              <th scope="col" className="num">
                {unit}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.label}>
                <td>{p.long ?? p.label}</td>
                <td className="num">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// Months across the bottom, one column per month
export function MonthColumns({ points, unit, format }: { points: Point[]; unit: string; format: (n: number) => string }) {
  const max = Math.max(...points.map((p) => p.value), 0);
  const maxIndex = points.findIndex((p) => p.value === max && max > 0);
  return (
    <figure style={{ margin: 0 }}>
      <div className="columns" role="list">
        {points.map((p, i) => (
          <div
            key={p.label}
            role="listitem"
            className={`column${i === points.length - 1 || i === maxIndex ? " labeled" : ""}`}
            tabIndex={0}
            title={`${p.long ?? p.label}: ${format(p.value)}`}
            aria-label={`${p.long ?? p.label}: ${format(p.value)}`}
          >
            <span className="column-value" aria-hidden="true">
              {format(p.value)}
            </span>
            <div className="column-fill" style={{ height: max ? `${(p.value / max) * 100}%` : "2px" }} />
          </div>
        ))}
      </div>
      <div className="column-labels" aria-hidden="true">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
      <DataTable points={points} unit={unit} format={format} />
    </figure>
  );
}

// One labeled bar per category
export function Bars({ points, unit, format, empty }: { points: Point[]; unit: string; format: (n: number) => string; empty: string }) {
  if (points.every((p) => p.value === 0)) return <p className="empty">{empty}</p>;
  const max = Math.max(...points.map((p) => p.value));
  return (
    <figure style={{ margin: 0 }}>
      <div className="bars">
        {points.map((p) => (
          <div className="bar-row" key={p.label} title={`${p.label}: ${format(p.value)}`}>
            <span className="bar-label">{p.label}</span>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${(p.value / max) * 100}%` }} />
            </div>
            <span className="bar-value">{format(p.value)}</span>
          </div>
        ))}
      </div>
      <DataTable points={points} unit={unit} format={format} />
    </figure>
  );
}
