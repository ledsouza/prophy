"use client";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { List, Spinner } from "@/components/common";

const DashboardPage = () => {
  const { data: user, isLoading, isFetching } = useRetrieveUserQuery();

  const config = [
    {
      label: "Nome",
      value: user?.name,
    },
    {
      label: "E-mail",
      value: user?.email,
    },
    {
      label: "Perfil",
      value: user?.role,
    },
  ];

  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center my-8">
        <Spinner lg />
      </div>
    );
  }

  return (
    <>
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1
            data-testid="dashboard-title"
            className="text-3xl font-bold tracking-tight text-gray-900"
          >
            Dashboard
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl py-6 my-8 sm:px-6 lg:px-8">
        <List config={config} />
      </main>
    </>
  );
};

export default DashboardPage;
