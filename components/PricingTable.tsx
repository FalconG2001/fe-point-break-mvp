"use client";

import React from "react";

interface PricingRow {
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  pricingType: "per_person" | "fixed_total";
  price: number;
  userType: string;
}

interface PricingTableProps {
  title: string;
  pricingData: PricingRow[];
}

const PricingTable: React.FC<PricingTableProps> = ({ title, pricingData }) => {
  const durations = [30, 60, 90, 120, 150, 180];
  const playerRanges = [
    { min: 1, max: 1, label: "1 Player" },
    { min: 2, max: 2, label: "2 Players" },
    { min: 3, max: 4, label: "3-4 Players" },
    { min: 5, max: 5, label: "5 Players" },
  ];

  const getPrice = (duration: number, minP: number, maxP: number) => {
    const row = pricingData.find(
      (p) =>
        p.durationMinutes === duration &&
        p.minPlayers === minP &&
        p.maxPlayers === maxP,
    );
    if (!row) return "-";
    return row.pricingType === "per_person"
      ? `₹${row.price}/person`
      : `₹${row.price} total`;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div> */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 ">
              <th className="px-6 py-4 text-lg font-semibold text-gray-900 ">
                Duration
              </th>
              {playerRanges.map((range) => (
                <th
                  key={range.label}
                  className="px-6 py-4 text-lg font-semibold text-gray-900 "
                >
                  {range.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 ">
            {durations.map((duration) => (
              <tr key={duration} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 ">
                  {duration >= 60
                    ? `${duration / 60} ${duration / 60 === 1 ? "hour" : "hours"}`
                    : `${duration} mins`}
                </td>
                {playerRanges.map((range) => (
                  <td
                    key={`${duration}-${range.label}`}
                    className="whitespace-nowrap px-6 py-4 text-gray-600 "
                  >
                    {getPrice(duration, range.min, range.max)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingTable;
