"use client";

import { TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AppointmentSearchTab from "@/components/appointments/AppointmentSearchTab";
import MedicalPhysicistClientSearchSection from "@/components/dashboard/MedicalPhysicistClientSearchSection";
import { Modal, ReportsSearchTab, ResourcePanelShell, Tab, TabList } from "@/components/common";
import { CreateAppointmentForm } from "@/components/forms";
import Role from "@/enums/Role";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const TAB_PARAM_TO_INDEX: Record<string, number> = {
    clients: 0,
    appointments: 1,
    reports: 2,
};

const getSelectedIndexFromTabParam = (tabParam: string | null): number => {
    if (!tabParam) {
        return 0;
    }

    return TAB_PARAM_TO_INDEX[tabParam] ?? 0;
};

function ClientPage() {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    useEffect(() => {
        setSelectedTabIndex(getSelectedIndexFromTabParam(searchParams.get("tab")));
    }, [searchParams]);

    const { currentModal, isModalOpen } = useAppSelector((state) => state.modal);

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            <ResourcePanelShell>
                <TabGroup selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
                    <TabList className="mb-6">
                        <Tab>Clientes</Tab>
                        <Tab>Agendamentos</Tab>
                        <Tab>Relatórios</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <MedicalPhysicistClientSearchSection dataCyPrefix="fme" />
                        </TabPanel>

                        <TabPanel>
                            <AppointmentSearchTab
                                canCreate={false}
                                dataCyPrefix="fme-appointments"
                                onOpenCreateAppointment={() =>
                                    dispatch(openModal(Modals.CREATE_APPOINTMENT))
                                }
                            />
                        </TabPanel>

                        <TabPanel>
                            <ReportsSearchTab currentUserRole={Role.FME} />
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </ResourcePanelShell>

            <Modal isOpen={isModalOpen} onClose={() => dispatch(closeModal())} className="max-w-lg">
                {currentModal === Modals.CREATE_APPOINTMENT && (
                    <CreateAppointmentForm
                        title="Novo Agendamento"
                        description="Selecione o cliente e a unidade para criar um novo agendamento."
                    />
                )}
            </Modal>
        </main>
    );
}

export default ClientPage;
