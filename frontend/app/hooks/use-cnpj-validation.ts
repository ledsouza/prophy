import { useState } from "react";
import { useVerifyProposalStatusMutation } from "@/redux/features/clientApiSlice";
import { toast } from "react-toastify";

const useCNPJValidation = (setIsModalOpen: (value: boolean) => void) => {
    const [verifyProposalStatus] = useVerifyProposalStatusMutation();
    const [validatedCNPJ, setValidatedCNPJ] = useState("");

    const validateCNPJ = async (cnpj: string) => {
        try {
            const response = await verifyProposalStatus(cnpj).unwrap();
            if (response.status) {
                toast.success("CNPJ Válido! Prossiga com o cadastro.");
                setValidatedCNPJ(cnpj);
                setIsModalOpen(true);
                return true;
            }
            toast.error(
                "O CNPJ não é válido. Verifique se você digitou corretamente ou entre em contato conosco."
            );
            return false;
        } catch (error: any) {
            if (error?.status === 404) {
                toast.error("Nenhum cliente foi encontrado com esse CNPJ.");
                return false;
            }
            console.error("Error verifying client status:", error);
            toast.error("Erro ao verificar CNPJ. Tente novamente mais tarde.");
            return false;
        }
    };

    return { validateCNPJ, validatedCNPJ };
};

export default useCNPJValidation;
