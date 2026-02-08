import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UnitDTO, UnitOperationDTO } from "./unitApiSlice";
import { EquipmentDTO, EquipmentOperationDTO } from "./equipmentApiSlice";
import type { UserDTO } from "@/types/user";
import { ProposalDTO } from "./proposalApiSlice";

export enum Modals {
    EDIT_CLIENT = "EDIT_CLIENT",
    REJECT_CLIENT = "REJECT_CLIENT",
    REVIEW_CLIENT = "REVIEW_CLIENT",
    CREATE_CLIENT = "CREATE_CLIENT",
    ADD_UNIT = "ADD_UNIT",
    EDIT_UNIT = "EDIT_UNIT",
    DELETE_UNIT = "DELETE_UNIT",
    REJECT_UNIT = "REJECT_UNIT",
    REVIEW_ADD_UNIT = "REVIEW_ADD_UNIT",
    REVIEW_EDIT_UNIT = "REVIEW_EDIT_UNIT",
    REVIEW_DELETE_UNIT = "REVIEW_DELETE_UNIT",
    ADD_EQUIPMENT = "ADD_EQUIPMENT",
    EDIT_EQUIPMENT = "EDIT_EQUIPMENT",
    DELETE_EQUIPMENT = "DELETE_EQUIPMENT",
    REJECT_EQUIPMENT = "REJECT_EQUIPMENT",
    REVIEW_EQUIPMENT = "REVIEW_EQUIPMENT",
    REVIEW_ADD_EQUIPMENT = "REVIEW_ADD_EQUIPMENT",
    REVIEW_EDIT_EQUIPMENT = "REVIEW_EDIT_EQUIPMENT",
    REVIEW_DELETE_EQUIPMENT = "REVIEW_DELETE_EQUIPMENT",
    EQUIPMENT_DETAILS = "EQUIPMENT_DETAILS",
    ADD_UNIT_MANAGER = "ADD_UNIT_MANAGER",
    REMOVE_UNIT_MANAGER = "REMOVE_UNIT_MANAGER",
    CREATE_PROPOSAL = "CREATE_PROPOSAL",
    EDIT_PROPOSAL = "EDIT_PROPOSAL",
    CREATE_APPOINTMENT = "CREATE_APPOINTMENT",
}

type ModalState = {
    isModalOpen: boolean;
    currentModal: Modals | null;
    isCloseDisabled: boolean;
    selectedUnit: UnitDTO | null;
    selectedUnitOperation: UnitOperationDTO | null;
    selectedEquipment: EquipmentDTO | null;
    selectedEquipmentOperation: EquipmentOperationDTO | null;
    selectedUser: UserDTO | null;
    selectedProposal: ProposalDTO | null;
};

const initialState: ModalState = {
    isModalOpen: false,
    currentModal: null,
    isCloseDisabled: false,
    selectedUnit: null,
    selectedUnitOperation: null,
    selectedEquipment: null,
    selectedEquipmentOperation: null,
    selectedUser: null,
    selectedProposal: null,
};

/**
 * Redux slice for managing modal state in the application.
 *
 * @slice
 * @name modal
 *
 * @property {boolean} isModalOpen - Indicates whether a modal is currently open
 * @property {Modals | null} currentModal - The currently active modal type or null if no modal is open
 *
 * @actions
 * - openModal: Opens a modal by setting the specified modal type as active
 * - closeModal: Closes the currently open modal and resets the state
 *
 * @example
 * ```typescript
 * dispatch(openModal(Modals.EDIT_CLIENT))
 * dispatch(closeModal())
 * ```
 */
const modalSlice = createSlice({
    name: "modal",
    initialState,
    reducers: {
        // Open a modal by setting it as the current modal and marking it open
        openModal(state, action: PayloadAction<Modals>) {
            state.isModalOpen = true;
            state.isCloseDisabled = false;
            state.currentModal = action.payload;
        },
        // Close the modal by resetting the state
        closeModal(state) {
            state.isModalOpen = false;
            state.isCloseDisabled = false;
            state.currentModal = null;
        },
        setModalCloseDisabled(state, action: PayloadAction<boolean>) {
            state.isCloseDisabled = action.payload;
        },
        setUnit(state, action: PayloadAction<UnitDTO>) {
            state.selectedUnit = action.payload;
        },
        setUnitOperation(state, action: PayloadAction<UnitOperationDTO>) {
            state.selectedUnitOperation = action.payload;
        },
        setEquipment(state, action: PayloadAction<EquipmentDTO>) {
            state.selectedEquipment = action.payload;
        },
        setEquipmentOperation(state, action: PayloadAction<EquipmentOperationDTO>) {
            state.selectedEquipmentOperation = action.payload;
        },
        setUser(state, action: PayloadAction<UserDTO>) {
            state.selectedUser = action.payload;
        },
        setProposal(state, action: PayloadAction<ProposalDTO>) {
            state.selectedProposal = action.payload;
        },
    },
});

export const {
    openModal,
    closeModal,
    setModalCloseDisabled,
    setUnit,
    setUnitOperation,
    setEquipment,
    setEquipmentOperation,
    setUser,
    setProposal,
} = modalSlice.actions;
export default modalSlice.reducer;
