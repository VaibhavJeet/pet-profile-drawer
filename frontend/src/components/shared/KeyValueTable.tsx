import type { JSX } from "react";

interface KeyValueItem {
  label: string;
  value: string | JSX.Element | JSX.Element[];
}

interface KeyValueTableProps {
  data: KeyValueItem[];
  editMode?: boolean;
}

const KeyValueTable = ({ data }: KeyValueTableProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {data.map((item, index) => (
        <div
          key={index}
          className={`flex justify-between items-start ${
            item.label === "Customer's Notes" || item.label === "Notes"
              ? "md:col-span-2 border-t-gray-400 border-t pt-4"
              : ""
          }`}
        >
          <div>
            <p className="text-gray-600 font-medium mr-2">{item.label}</p>
            <p className="text-black flex-1 my-2">
              {Array.isArray(item.value) ? item.value : item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyValueTable;
