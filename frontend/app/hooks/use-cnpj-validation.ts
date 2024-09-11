import { useState } from "react";
import { useVerifyPropostaStatusMutation } from "@/redux/features/clienteApiSlice";
import { toast } from "react-toastify";

const useCNPJValidation = (setIsModalOpen: (value: boolean) => void) => {
    const [verifyPropostaStatus] = useVerifyPropostaStatusMutation();
    const [validatedCNPJ, setValidatedCNPJ] = useState("");

    const validateCNPJ = async (cnpj: string) => {
        try {
            const response = await verifyPropostaStatus({ cnpj }).unwrap();
            if (response.approved) {
                toast.success("CNPJ Válido! Prossiga com o cadastro.");
                setValidatedCNPJ(cnpj);
                setIsModalOpen(true);
                return true;
            } else {
                toast.error(
                    "O CNPJ não é válido. Verifique se você digitou corretamente ou entre em contato conosco."
                );
                return false;
            }
        } catch (error) {
            console.error("Error verifying client status:", error);
            toast.error("Erro ao verificar CNPJ. Tente novamente mais tarde.");
            return false;
        }
    };

    return { validateCNPJ, validatedCNPJ };
};

export default useCNPJValidation;
