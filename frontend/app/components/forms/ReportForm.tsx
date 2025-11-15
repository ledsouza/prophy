"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/common";
import { Form, Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useCreateReportMutation } from "@/redux/features/reportApiSlice";
import { useReportTypeSelect } from "@/hooks";
import { reportFileSchema } from "@/schemas";

type ReportFormProps = {
    isUnit: boolean;
    unitId?: number;
    equipmentId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    submitTestId?: string;
};

const reportFormSchema = z.object({
    completion_date: z
        .string()
        .min(1, { message: "Data de conclusão é obrigatória." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida." }),
    file: reportFileSchema,
});

type ReportFormFields = z.infer<typeof reportFormSchema>;

function formatDateLocalYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const ReportForm = ({
    isUnit,
    unitId,
    equipmentId,
    onSuccess,
    onCancel,
    submitTestId = "btn-report-create-submit",
}: ReportFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ReportFormFields>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            completion_date: formatDateLocalYYYYMMDD(new Date()),
        },
    });

    const [createReport, { isLoading: isCreating }] = useCreateReportMutation();

    const { options, selectedOption, selectedReportTypeCode, setSelect } = useReportTypeSelect({
        isUnit,
    });

    const canSubmitContext =
        (isUnit && typeof unitId === "number") || (!isUnit && typeof equipmentId === "number");

    const onSubmit: SubmitHandler<ReportFormFields> = async (data) => {
        if (!canSubmitContext) {
            toast.error(
                isUnit
                    ? "Não foi possível identificar a unidade para o relatório."
                    : "Não foi possível identificar o equipamento para o relatório."
            );
            return;
        }

        try {
            const file = data.file[0];
            await createReport({
                completion_date: data.completion_date,
                report_type: selectedReportTypeCode,
                file,
                unit: isUnit ? unitId : undefined,
                equipment: !isUnit ? equipmentId : undefined,
            }).unwrap();

            toast.success("Relatório criado com sucesso.");
            onSuccess?.();
        } catch (err: any) {
            const message =
                err?.data?.detail ||
                err?.data?.message ||
                "Não foi possível gerar o relatório. Verifique os dados e tente novamente.";
            toast.error(message);
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Gerar relatório
                </Typography>

                <Input
                    {...register("completion_date")}
                    type="date"
                    errorMessage={errors.completion_date?.message}
                    label="Data de conclusão"
                    data-testid="report-completion-date-input"
                ></Input>

                <Select
                    options={options}
                    selectedData={selectedOption}
                    setSelect={setSelect}
                    label="Tipo de relatório"
                    labelSize="sm"
                    listBoxButtonSize="sm"
                    listOptionSize="sm"
                    dataTestId="report-type-select"
                />

                <Input
                    {...register("file")}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    errorMessage={errors.file?.message}
                    label="Arquivo do relatório"
                    data-testid="report-file-input"
                ></Input>

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSubmitting || isCreating}
                        className="w-1/2"
                        data-testid="cancel-btn"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isCreating}
                        className="w-1/2"
                        data-testid={submitTestId}
                    >
                        {isSubmitting || isCreating ? "Enviando..." : "Gerar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default ReportForm;
