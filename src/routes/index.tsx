import { createFileRoute } from "@tanstack/react-router";
import { Boot } from "@/components/Boot";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Boot />;
}
