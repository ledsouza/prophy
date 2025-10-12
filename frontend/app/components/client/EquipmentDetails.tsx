import Image from "next/image";
import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { useGetAccessoriesQuery } from "@/redux/features/accessoryApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";

import notFound from "@/assets/image-not-found.png";
import { XCircleIcon } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Tab } from "@/components/common";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
    onClose: () => void;
};

function EquipmentDetails({ equipment, onClose }: EquipmentDetailsProps) {
    const { data: accessories = [] } = useGetAccessoriesQuery();
    const equipmentAccessories = accessories.filter(
        (accessory) => accessory.equipment === equipment.id
    );

    const formattedDate = equipment.purchase_installation_date
        ? format(new Date(equipment.purchase_installation_date), "dd/MM/yyyy", { locale: ptBR })
        : "Não informado";

    return (
        <div className="flex flex-col" data-testid="equipment-details">
            <button
                onClick={onClose}
                className="absolute right-1 top-1 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                data-testid="btn-close-modal"
                aria-label="Fechar modal"
            >
                <XCircleIcon size={32} className="text-primary" />
            </button>

            {/* Equipment photo */}
            <div className="relative w-full h-[400px]">
                <Image
                    src={
                        equipment.equipment_photo
                            ? process.env.NEXT_PUBLIC_HOST + equipment.equipment_photo
                            : notFound
                    }
                    alt="Imagem do equipamento"
                    fill={true}
                    className="shadow-lg ring-2"
                    style={{
                        objectFit: "contain",
                    }}
                />
            </div>

            {/* Tabs */}
            <div className="m-6">
                <TabGroup>
                    <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                        <Tab>Informações Gerais</Tab>
                        <Tab>Especificações Técnicas</Tab>
                        <Tab>Manutenção</Tab>
                        <Tab>Acessórios ({equipmentAccessories.length})</Tab>
                    </TabList>

                    <TabPanels className="mt-4">
                        {/* General Information Panel */}
                        <TabPanel className="rounded-xl bg-white p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Typography
                                        element="h3"
                                        size="lg"
                                        className="font-semibold mb-2"
                                    >
                                        Informações do Equipamento
                                    </Typography>
                                    <Typography size="md">
                                        <b>Modelo:</b> {equipment.model}
                                        <br />
                                        <b>Fabricante:</b> {equipment.manufacturer}
                                        <br />
                                        <b>Modalidade:</b> {equipment.modality.name}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography
                                        element="h3"
                                        size="lg"
                                        className="font-semibold mb-2"
                                    >
                                        Registro
                                    </Typography>
                                    <Typography size="md">
                                        <b>Número de Série:</b>{" "}
                                        {equipment.series_number || "Não informado"}
                                        <br />
                                        <b>Registro da Anvisa:</b>{" "}
                                        {equipment.anvisa_registry || "Não informado"}
                                    </Typography>
                                </div>

                                {/* Label Photo */}
                                {equipment.label_photo && (
                                    <div className="col-span-1 md:col-span-2">
                                        <Typography
                                            element="h3"
                                            size="lg"
                                            className="font-semibold mb-2"
                                        >
                                            Rótulo
                                        </Typography>
                                        <Image
                                            src={
                                                process.env.NEXT_PUBLIC_HOST + equipment.label_photo
                                            }
                                            alt="Rótulo do equipamento"
                                            width={200}
                                            height={200}
                                            className="ring-1 shadow-md rounded-md"
                                            style={{
                                                objectFit: "contain",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </TabPanel>

                        {/* Technical Specifications Panel */}
                        <TabPanel className="rounded-xl bg-white p-3">
                            <Typography element="h3" size="lg" className="font-semibold mb-4">
                                Especificações Técnicas
                            </Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Typography size="md">
                                        <b>Canais:</b> {equipment.channels || "Não informado"}
                                        <br />
                                        <b>Carga Máxima Oficial:</b>{" "}
                                        {equipment.official_max_load
                                            ? `${equipment.official_max_load} kg`
                                            : "Não informado"}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography size="md">
                                        <b>Carga Máxima Usual:</b>{" "}
                                        {equipment.usual_max_load
                                            ? `${equipment.usual_max_load} kg`
                                            : "Não informado"}
                                        <br />
                                        <b>Data de Compra/Instalação:</b> {formattedDate}
                                    </Typography>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Maintenance Panel */}
                        <TabPanel className="rounded-xl bg-white p-3">
                            <Typography element="h3" size="lg" className="font-semibold mb-4">
                                Informações de Manutenção
                            </Typography>
                            <Typography size="md">
                                <b>Responsável:</b>{" "}
                                {equipment.maintenance_responsable || "Não informado"}
                                <br />
                                <b>Email:</b>{" "}
                                {equipment.email_maintenance_responsable || "Não informado"}
                                <br />
                                <b>Telefone:</b>{" "}
                                {equipment.phone_maintenance_responsable || "Não informado"}
                            </Typography>
                        </TabPanel>

                        {/* Accessories Panel */}
                        <TabPanel className="rounded-xl bg-white p-3">
                            <Typography element="h3" size="lg" className="font-semibold mb-4">
                                Acessórios
                            </Typography>

                            {equipmentAccessories.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {equipmentAccessories.map((accessory) => (
                                        <div
                                            key={accessory.id}
                                            className="border rounded-md p-4 shadow-sm"
                                        >
                                            <div className="flex gap-4">
                                                {accessory.equipment_photo && (
                                                    <div className="relative w-20 h-20 flex-shrink-0">
                                                        <Image
                                                            src={
                                                                process.env.NEXT_PUBLIC_HOST +
                                                                accessory.equipment_photo
                                                            }
                                                            alt={`Acessório ${accessory.model}`}
                                                            fill={true}
                                                            className="rounded-md"
                                                            style={{ objectFit: "cover" }}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <Typography size="md" className="font-bold">
                                                        {accessory.model}
                                                    </Typography>
                                                    <Typography size="sm">
                                                        <b>Fabricante:</b> {accessory.manufacturer}
                                                        <br />
                                                        <b>Número de Série:</b>{" "}
                                                        {accessory.series_number}
                                                        <br />
                                                        <b>Categoria:</b>{" "}
                                                        {accessory.category ===
                                                        AccessoryType.DETECTOR
                                                            ? "Detector"
                                                            : accessory.category ===
                                                                AccessoryType.COIL
                                                              ? "Bobina"
                                                              : accessory.category ===
                                                                  AccessoryType.TRANSDUCER
                                                                ? "Transdutor"
                                                                : "Não especificado"}
                                                    </Typography>
                                                </div>
                                            </div>

                                            {accessory.label_photo && (
                                                <div className="mt-2">
                                                    <Typography
                                                        size="sm"
                                                        className="font-semibold mb-1"
                                                    >
                                                        Rótulo:
                                                    </Typography>
                                                    <Image
                                                        src={
                                                            process.env.NEXT_PUBLIC_HOST +
                                                            accessory.label_photo
                                                        }
                                                        alt={`Rótulo do acessório ${accessory.model}`}
                                                        width={100}
                                                        height={100}
                                                        className="ring-1 shadow-sm rounded-md"
                                                        style={{ objectFit: "contain" }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Typography size="md">
                                    Nenhum acessório cadastrado para este equipamento.
                                </Typography>
                            )}
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </div>
        </div>
    );
}

export default EquipmentDetails;
