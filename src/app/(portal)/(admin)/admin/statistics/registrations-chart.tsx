"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RegistrationsChart({
  data,
}: {
  data: { name: string; registrations: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef2" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#67728a" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#67728a" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "#f6f7f9" }} />
        <Bar dataKey="registrations" fill="#3380ff" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
