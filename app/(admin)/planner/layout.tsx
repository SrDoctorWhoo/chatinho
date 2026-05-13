import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planner | Chatinho',
  description: 'Gerenciamento de tarefas e atendimentos do Chatinho.',
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
