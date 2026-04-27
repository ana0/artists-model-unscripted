import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopQuestion } from "../services";

const barStyle = (open) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  padding: "10px 16px",
  fontWeight: "bold",
  color: "white",
  background: open ? "#2e7d32" : "#c62828",
  textAlign: "center",
});

const PollStatusBar = () => {
  const { data } = useQuery({
    queryKey: ["getTopQuestion"],
    queryFn: async () => getTopQuestion(),
    refetchInterval: 1000,
  });

  if (!data || !data.poll || data.poll.length === 0) return null;

  const open = !data.poll[0].closed;
  const question = data.poll[0].question;

  return (
    <div style={barStyle(open)}>
      {open ? `Question open: ${question}` : "Question closed"}
    </div>
  );
};

export default PollStatusBar;
