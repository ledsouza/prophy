export enum Modals {
    EDIT_CLIENT = "EDIT_CLIENT",
    REJECT_CLIENT = "REJECT_CLIENT",
    EDIT_UNIT = "EDIT_UNIT",
    DELETE_UNIT = "DELETE_UNIT",
    REJECT_UNIT = "REJECT_UNIT",
    EDIT_EQUIPMENT = "EDIT_EQUIPMENT",
    DELETE_EQUIPMENT = "DELETE_EQUIPMENT",
    REJECT_EQUIPMENT = "REJECT_EQUIPMENT",
    EQUIPMENT_DETAILS = "EQUIPMENT_DETAILS",
}

type handleCloseModalProps = {
    setIsModalOpen: (value: boolean) => void;
    setCurrentModal: (value: null) => void;
};

export const handleCloseModal = ({
    setIsModalOpen,
    setCurrentModal,
}: handleCloseModalProps) => {
    setIsModalOpen(false);
    setCurrentModal(null);
};
