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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a4a4a4" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#a4a4a4" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{ background: "#172c28", border: "none", color: "white" }}
        />
        <Bar dataKey="registrations" fill="#f1c548" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
