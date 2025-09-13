import React, { useState, useMemo, useRef } from "react";
import { FiSearch } from 'react-icons/fi';

interface TableRow {
  id: number;
  userName: string;
  status: string;
  pets: { id: number; name: string; avatar: string }[];
  [key: string]: any;
}

interface CustomGridColDef {
  field: string;
  headerName: string;
  flex?: number;
  valueFormatter?: (params: { value: any }) => string | null;
  renderCell?: (row: TableRow) => React.ReactNode;
}

interface TableComponentProps {
  data: TableRow[];
  columns: CustomGridColDef[];
}

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  columns
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [includeInactive, setIncludeInactive] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(value), 300);
  };

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    let result = [...data];
    if (!includeInactive) {
      result = result.filter((row) => row.status === "Active");
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((row) => 
        row.userName.toLowerCase().includes(lowerSearch) ||
        row.pets.some((pet) => pet.name.toLowerCase().includes(lowerSearch))
      );
    }
    return result;
  }, [data, search, includeInactive]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();
      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderStatus = (row: TableRow) => (
    <span
      className={`px-2 py-1 rounded text-xs ${
        row.status === "Active"
          ? "bg-green-500 text-white"
          : "bg-gray-300 text-black"
      }`}
    >
      {row.status}
    </span>
  );

  return (
    <div className="bg-white shadow-lg rounded-sm border border-gray-300 font-tahoma p-4">

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="relative w-full sm:w-auto">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email or pets"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-nav w-full sm:w-auto"
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="includeInactive" 
              checked={includeInactive} 
              onChange={(e) => setIncludeInactive(e.target.checked)} 
              className="mr-2 focus:ring-2 focus:ring-blue-500" 
            />
            <label htmlFor="includeInactive" className="text-nav">Include Inactive</label>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto min-w-[700px]">
          <thead>
            <tr className="bg-[#E0E6E6] text-black font-tahoma text-nav font-bold">
              {columns.map((col) => (
                <th
                  key={col.field}
                  className="px-4 py-3 text-center cursor-pointer border-r-2 border-[#d4d8d8] last:border-r-0"
                  onClick={() => handleSort(col.field)}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>{col.headerName}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-200 hover:bg-gray-100 text-nav"
                >
                  {columns.map((col) => (
                    <td
                      key={col.field}
                      className="px-4 py-3 text-center border-r border-[#E0E6E6] last:border-r-0"
                    >
                      {col.renderCell ? col.renderCell(row) : (
                        col.field === "status" ? renderStatus(row) : (
                          col.valueFormatter
                            ? col.valueFormatter({ value: row[col.field] })
                            : row[col.field]?.toString() || ""
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-nav gap-4">
        <div className="flex items-center space-x-4">
          <select
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {[5, 10, 25].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            Showing {page * pageSize + 1} to{" "}
            {Math.min((page + 1) * pageSize, sortedData.length)} of{" "}
            {sortedData.length} entries
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
            disabled={(page + 1) * pageSize >= sortedData.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;